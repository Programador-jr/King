const express = require("express");
const http = require("http");  
const url = require(`url`);
const path = require(`path`);
const { Permissions } = require("discord.js");
const ejs = require("ejs");
const fs = require("fs")
const passport = require(`passport`);
const Strategy = require(`passport-discord`).Strategy;
const BotConfig = require("../botconfig/config.json");
const BotFilters = require("../botconfig/filters.json");
const BotEmojis = require("../botconfig/emojis.json");
const BotEmbed = require("../botconfig/embed.json");
const { YT_MIXES, SPOTIFY_MIXES } = require("../handlers/customMixes");
const { getSongSearchData, getLyricsWithFallback } = require("../handlers/lyricsService");
const {
  getDashboardPort,
  getDashboardBaseUrl,
  getDashboardCallbackUrl,
} = require("../handlers/dashboardConfig");

const getBotData = (client) => ({
  avatar: client.user.displayAvatarURL({ size: 128 }),
  avatar512: client.user.displayAvatarURL({ size: 512 }),
  username: client.user.username,
  id: client.user.id,
  guildCount: client.guilds.cache.size,
  guilds: client.guilds.cache,
  settings: client.settings,
  discord: client.user,
  distube: {
    getQueue: (guildId) => client.distube.getQueue(guildId)
  }
});

const getQueueBotData = (client) => {
  const data = getBotData(client);
  data.getQueue = (guildId) => client.distube.getQueue(guildId);
  return data;
};

/**
 *  STARTING THE WEBSITE
 * @param {*} client THE DISCORD BOT CLIENT 
 */
module.exports = client => {
    //Start teh website
    console.log("Loading DashBoard settings")
    const settings = require("./settings.json");
    const dashboardClientId = process.env.DASHBOARD_CLIENT_ID || settings?.config?.clientID || "";
    const dashboardClientSecret = process.env.DASHBOARD_CLIENT_SECRET || settings?.config?.secret || "";
    const dashboardSessionSecret = process.env.DASHBOARD_SESSION_SECRET || `#@%#&^$^$%@$^$&%#$%@#$%$^%&$%^#$%@#$%#E%#%@$FEErfgr3g#%GT%536c53cc6%5%tv%4y4hrgrggrgrgf4n`;

    if (!dashboardClientId || !dashboardClientSecret) {
      console.log("[dashboard] Desativado: DASHBOARD_CLIENT_ID/DASHBOARD_CLIENT_SECRET ausentes no .env (ou dashboard/settings.json).");
      return;
    }

    const httpPort = getDashboardPort(settings);
    const resolvedDomain = getDashboardBaseUrl(settings) || `http://127.0.0.1:${httpPort}`;
    const resolvedCallback = getDashboardCallbackUrl(settings) || `${resolvedDomain}/callback`;
    const isLocalCallback = /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])(:\d+)?(\/|$)/i.test(resolvedCallback);
    console.log(`[dashboard] OAuth callback URL: ${resolvedCallback}`);

    const getRequestProtocol = (req) => {
      const forwardedProto = String(req?.headers?.["x-forwarded-proto"] || "").split(",")[0].trim();
      return forwardedProto || req.protocol || "http";
    };

    const resolveCallbackForRequest = (req) => {
      if (!req) return resolvedCallback;
      if (!isLocalCallback) return resolvedCallback;
      const protocol = getRequestProtocol(req);
      const host = req.get("host");
      if (!host) return resolvedCallback;
      return `${protocol}://${host}/callback`;
    };

    const setOAuthCallbackInSession = (req) => {
      const callbackURL = resolveCallbackForRequest(req);
      if (req?.session) req.session.oauthCallback = callbackURL;
      return callbackURL;
    };

    const getOAuthCallbackFromSession = (req) => {
      const fromSession = String(req?.session?.oauthCallback || "").trim();
      if (fromSession) return fromSession;
      return resolveCallbackForRequest(req);
    };

    const isTransientOAuthProfileError = (err) => {
      const message = String(err?.message || "");
      const providerData = String(err?.oauthError?.data || "");
      const combined = `${message} ${providerData}`.toLowerCase();
      return combined.includes("failed to fetch the user profile")
        || combined.includes("upstream connect error")
        || combined.includes("disconnect/reset before headers")
        || combined.includes("reset reason: overflow")
        || combined.includes("econnreset")
        || combined.includes("etimedout")
        || combined.includes("socket hang up");
    };

    const hasManageGuildPermission = (permissionsValue) => {
      try {
        const perms = BigInt(permissionsValue || 0);
        const MANAGE_GUILD = 0x20n;
        return (perms & MANAGE_GUILD) === MANAGE_GUILD;
      } catch {
        return false;
      }
    };

    const userCanManageGuild = (req, guildId) => {
      if (!req?.isAuthenticated?.() || !req?.user?.guilds || !Array.isArray(req.user.guilds)) return false;
      const userGuild = req.user.guilds.find((entry) => String(entry.id) === String(guildId));
      if (!userGuild) return false;
      return hasManageGuildPermission(userGuild.permissions_new);
    };

    const resolveEmbedReturnTo = (guildId, rawInput) => {
      const fallback = `/dashboard/${guildId}/tickets`;
      const raw = String(rawInput || "").trim();
      if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return fallback;
      if (!raw.startsWith(`/dashboard/${guildId}/tickets`)) return fallback;
      return raw;
    };

    const DASHBOARD_HIDDEN_FILTERS = new Set(["custombassboost", "customspeed", "clear"]);
    const sanitizeDashboardFilters = (filtersInput) => {
      const filtersArray = Array.isArray(filtersInput)
        ? filtersInput
        : filtersInput
          ? [filtersInput]
          : [];

      const unique = [...new Set(filtersArray.map((filter) => String(filter || "").trim()).filter(Boolean))];
      return unique.filter((filter) => Object.prototype.hasOwnProperty.call(BotFilters, filter) && !DASHBOARD_HIDDEN_FILTERS.has(filter));
    };

    const normalizeSettingsArray = (value) => {
      const values = Array.isArray(value)
        ? value
        : value
          ? [value]
          : [];
      return [...new Set(values.map((item) => String(item || "").trim()).filter(Boolean))];
    };

    const normalizePanelLogsInput = (logsInput) => {
      const source = logsInput && typeof logsInput === "object" ? logsInput : {};
      const normalizeEntry = (entryInput) => {
        const entry = entryInput && typeof entryInput === "object" ? entryInput : {};
        return {
          enabled: Boolean(entry.enabled),
          type: entry.type === "webhook" ? "webhook" : "channel",
          channelId: String(entry.channelId || "").trim(),
          webhookUrl: String(entry.webhookUrl || "").trim(),
          message: String(entry.message || "").trim()
        };
      };
      return {
        open: normalizeEntry(source.open),
        close: normalizeEntry(source.close)
      };
    };

    const resolveValidatedPanelLogEntry = async (guild, entry, label) => {
      const normalized = {
        enabled: Boolean(entry.enabled),
        type: entry.type === "webhook" ? "webhook" : "channel",
        channelId: null,
        webhookUrl: null,
        message: entry.message || null
      };

      if (!normalized.enabled) {
        return { ok: true, value: normalized };
      }

      if (normalized.type === "channel") {
        if (!entry.channelId) {
          return { ok: false, message: `Selecione o canal do log de ${label}.` };
        }
        let ch = guild.channels.cache.get(entry.channelId);
        if (!ch) {
          try { ch = await guild.channels.fetch(entry.channelId); } catch (e) {}
        }
        if (!ch || typeof ch.isTextBased !== "function" || !ch.isTextBased()) {
          return { ok: false, message: `Canal de log de ${label} inválido.` };
        }
        normalized.channelId = entry.channelId;
        return { ok: true, value: normalized };
      }

      if (!entry.webhookUrl || !entry.webhookUrl.startsWith("https://discord.com/api/webhooks/")) {
        return { ok: false, message: `Webhook de log de ${label} inválido.` };
      }
      normalized.webhookUrl = entry.webhookUrl;
      return { ok: true, value: normalized };
    };

    const resolveValidatedPanelLogs = async (guild, logsInput) => {
      const normalized = normalizePanelLogsInput(logsInput);
      const openResult = await resolveValidatedPanelLogEntry(guild, normalized.open, "abertura");
      if (!openResult.ok) return openResult;
      const closeResult = await resolveValidatedPanelLogEntry(guild, normalized.close, "fechamento");
      if (!closeResult.ok) return closeResult;
      return {
        ok: true,
        value: {
          open: openResult.value,
          close: closeResult.value
        }
      };
    };

    const checkApiAuth = (req, res, next) => {
      if (req.isAuthenticated()) return next();
      const redirectTo = `/queue/${req.params.guildID}`;
      return res.status(401).json({
        ok: false,
        message: "Login necessario para usar os controles.",
        login: `/login?redirect=${encodeURIComponent(redirectTo)}`
      });
    };

    const websiteInfo = {
      ...settings.website,
      domain: resolvedDomain,
    };
    // We instantiate express app and the session store.
    const app = express();
    const httpApp = express();
    const session = require(`express-session`);
    const MemoryStore = require(`memorystore`)(session);

    /**
     * @INFO - Initial the Discord Login Setup!
     */
    passport.serializeUser((user, done) => done(null, user));
    passport.deserializeUser((obj, done) => done(null, obj));
    passport.use(new Strategy({
      clientID: dashboardClientId,
      clientSecret: dashboardClientSecret,
      callbackURL: resolvedCallback,      
      scope: [`identify`, `guilds`, `guilds.join`]
    },
    (accessToken, refreshToken, profile, done) => { 
      process.nextTick(() => done(null, profile));
    }));

    
    /**
     * @INFO - ADD A SESSION SAVER
     */
    app.use(session({
        store: new MemoryStore({ checkPeriod: 86400000 }),
        secret: dashboardSessionSecret,
        resave: false,
        saveUninitialized: false,
    }));

    // initialize passport middleware.
    app.use(passport.initialize());
    app.use(passport.session());


    app.set('view engine', 'ejs');
    app.set('views', path.join(__dirname, './views'))


    //Those for app.use(s) are for the input of the post method (updateing settings)
    app.use(express.json());
    app.use(express.urlencoded({
      extended: true
    }));

    //LOAD THE ASSETS
    app.use(express.static(path.join(__dirname, './public')));
    //Load .well-known (if available)
    app.use(express.static(path.join(__dirname, '/'), {dotfiles: 'allow'}));
    
    // We declare a checkAuth function middleware to check if an user is logged in or not, and if not redirect him.
    const checkAuth = (req, res, next) => {
      if (req.isAuthenticated()) return next();
      req.session.backURL = req.originalUrl || req.url || "/dashboard";
      const callbackURL = setOAuthCallbackInSession(req);
      return passport.authenticate("discord", {
        prompt: "consent",
        callbackURL
      })(req, res, next);
    };

    //Login endpoint
    app.get(`/login`, (req, res, next) => {
        if (req.isAuthenticated()) {
          return res.redirect("/dashboard");
        }

        const redirectQuery = typeof req.query.redirect === "string" ? req.query.redirect.trim() : "";
        if (redirectQuery && redirectQuery.startsWith("/")) {
          req.session.backURL = redirectQuery;
        } else if (!req.session.backURL && req.headers.referer) {
          const parsed = url.parse(req.headers.referer);
          if (parsed.host === req.get("host") && parsed.path && parsed.path.startsWith("/")) {
            req.session.backURL = parsed.path;
          }
        }

        if (!req.session.backURL) {
          req.session.backURL = "/dashboard";
        }

        const callbackURL = setOAuthCallbackInSession(req);
        return passport.authenticate(`discord`, {
          prompt: "consent",
          callbackURL
        })(req, res, next);
      }
    );


    //Callback endpoint for the login data
    app.get(`/callback`, (req, res, next) => {
        const callbackURL = getOAuthCallbackFromSession(req);
        return passport.authenticate(`discord`, { callbackURL }, (err, user) => {
          if (err) {
            const oauthData = err?.oauthError?.data ? String(err.oauthError.data) : "";
            console.error(`[dashboard][oauth] Token exchange failed: ${err.message}`);
            if (oauthData) console.error(`[dashboard][oauth] Provider response: ${oauthData}`);
            console.error(`[dashboard][oauth] callbackURL used: ${callbackURL}`);

            const retryCount = Number(req?.session?.oauthRetryCount || 0);
            if (isTransientOAuthProfileError(err) && retryCount < 1) {
              console.warn("[dashboard][oauth] Transient profile fetch error detected, retrying login once.");
              if (req?.session) {
                req.session.oauthRetryCount = retryCount + 1;
                req.session.oauthCallback = callbackURL;
              }
              return res.redirect("/login?retry=1");
            }

            if (req?.session) req.session.oauthRetryCount = null;
            req.session.oauthCallback = null;
            return res.redirect("/?error=oauth_token");
          }

          if (!user) {
            if (req?.session) req.session.oauthRetryCount = null;
            req.session.oauthCallback = null;
            return res.redirect("/?error=oauth_user");
          }

          req.logIn(user, (loginErr) => {
            if (loginErr) {
              console.error("[dashboard][oauth] Session login failed:", loginErr.message);
              if (req?.session) req.session.oauthRetryCount = null;
              req.session.oauthCallback = null;
              return res.redirect("/?error=oauth_login");
            }
            return next();
          });
        })(req, res, next);
    }, async (req, res) => {
        let banned = false // req.user.id
        if(banned) {
                req.session.destroy(() => {
                res.json({ login: false, message: `Você foi bloqueado no painel.`, logout: true })
                req.logout();
            });
        } else {
            const backURL = typeof req.session.backURL === "string" && req.session.backURL.startsWith("/")
              ? req.session.backURL
              : "/dashboard";
            req.session.backURL = null;
            req.session.oauthCallback = null;
            req.session.oauthRetryCount = null;
            res.redirect(backURL);
        }
    });



    //When the website is loaded on the main page, render the main page + with those variables
    app.get("/", (req, res) => {
        res.render("index", {
          req: req,
          user: req.isAuthenticated() ? req.user : null,
          //guild: client.guilds.cache.get(req.params.guildID),
          bot: getBotData(client),
          Permissions: Permissions,
          websiteInfo: websiteInfo,
          callback: resolveCallbackForRequest(req),
          categories: client.categories, 
          commands: client.commands, 
          BotConfig: BotConfig,
          BotFilters: BotFilters,
          SPOTIFY_MIXES: SPOTIFY_MIXES,
          YT_MIXES: YT_MIXES,
          BotEmojis: BotEmojis,
          ytMixesTotal: Object.keys(YT_MIXES || {}).length,
        });
    })


    app.get("/termos", (req, res) => {
      res.render("termos", {
        req: req,
        user: req.isAuthenticated() ? req.user : null,
        bot: getBotData(client),
        Permissions: Permissions,
        websiteInfo: websiteInfo,
      });
    })

    app.get("/privacidade", (req, res) => {
      res.render("privacidade", {
        req: req,
        user: req.isAuthenticated() ? req.user : null,
        bot: getBotData(client),
        Permissions: Permissions,
        websiteInfo: websiteInfo,
      });
    })


    // When the commands page is loaded, render it with those settings
    app.get("/commands", (req, res) => {
      res.render("commands", {
        req: req,
        user: req.isAuthenticated() ? req.user : null,
        //guild: client.guilds.cache.get(req.params.guildID),
        bot: getBotData(client),
        Permissions: Permissions,
        websiteInfo: websiteInfo,
        callback: resolveCallbackForRequest(req),
        categories: client.categories, 
        commands: client.commands, 
        BotConfig: BotConfig,
        BotFilters: BotFilters,
          SPOTIFY_MIXES: SPOTIFY_MIXES,
          YT_MIXES: YT_MIXES,
        BotEmojis: BotEmojis,
      })
    })


    //Logout the user and move him back to the main page
    app.get(`/logout`, function (req, res) {
      req.session.destroy(() => {
        req.logout();
        res.redirect(`/`);
      });
    });

    // Dashboard endpoint.
    app.get("/dashboard", checkAuth, async (req,res) => {
      if(!req.isAuthenticated() || !req.user) 
      return res.redirect("/?error=" + encodeURIComponent("Login First!"));
      if(!req.user.guilds)
      return res.redirect("/?error=" + encodeURIComponent("Unable to get your Guilds!"));
        res.render("dashboard", {
          req: req,
          user: req.isAuthenticated() ? req.user : null,
          //guild: client.guilds.cache.get(req.params.guildID),
          bot: getBotData(client),
          Permissions: Permissions,
          websiteInfo: websiteInfo,
          callback: resolveCallbackForRequest(req),
          categories: client.categories, 
          commands: client.commands, 
          BotConfig: BotConfig,
          BotFilters: BotFilters,
          SPOTIFY_MIXES: SPOTIFY_MIXES,
          YT_MIXES: YT_MIXES,
          BotEmojis: BotEmojis,
        });
    })

    // Settings endpoint.
    app.get("/dashboard/:guildID", checkAuth, async (req, res) => {
      // We validate the request, check if guild exists, member is in guild and if member has minimum permissions, if not, we redirect it back.
      const guild = client.guilds.cache.get(req.params.guildID);
      if (!guild) return res.redirect("/dashboard?error=" + encodeURIComponent("Can't get Guild Information Data"));
      let member = guild.members.cache.get(req.user.id);
      if (!member) {
        try {
          member = await guild.members.fetch(req.user.id);
        } catch (err) {
          console.error(`Couldn't fetch ${req.user.id} in ${guild.name}: ${err}`);
        }
      }
      if (!member) return res.redirect("/dashboard?error=" + encodeURIComponent("Unable to fetch you, sorry!"));
      if (!member.permissions.has("MANAGE_GUILD")) {
        return res.redirect("/dashboard?error=" + encodeURIComponent("You are not allowed to do that!"));
      }
      client.settings.ensure(guild.id, {
        prefix: BotConfig.prefix,      
        defaultvolume: 50,
        defaultautoplay: false,
        defaultfilters: [],
        djroles: [],
        botchannel: [],
        musicChannels: [],
        confessionChannel: null,
        moderationRoles: [],
        moderationLogEnabled: false,
        moderationLogType: "channel",
        moderationLogChannelId: null,
        moderationLogWebhook: null,
        mixDefault: "youtube"
      })

      const storedDefaultFilters = client.settings.get(guild.id, "defaultfilters");
      const storedArray = Array.isArray(storedDefaultFilters) ? storedDefaultFilters.map((f) => String(f || "").trim()).filter(Boolean) : [];
      const normalizedDefaultFilters = sanitizeDashboardFilters(storedDefaultFilters);

      const isDifferent =
        storedArray.length !== normalizedDefaultFilters.length ||
        storedArray.some((filter, idx) => filter !== normalizedDefaultFilters[idx]);
      if (isDifferent) {
        client.settings.set(guild.id, normalizedDefaultFilters, "defaultfilters");
      }


      // We render template using the absolute path of the template and the merged default data with the additional data provided.
      res.render("settings", {
          req: req,
          user: req.isAuthenticated() ? req.user : null,
          guild: client.guilds.cache.get(req.params.guildID),
          bot: getBotData(client),
          Permissions: Permissions,
          websiteInfo: websiteInfo,
          callback: resolveCallbackForRequest(req),
          categories: client.categories, 
          commands: client.commands, 
          BotConfig: BotConfig,
          BotFilters: BotFilters,
          SPOTIFY_MIXES: SPOTIFY_MIXES,
          YT_MIXES: YT_MIXES,
          BotEmojis: BotEmojis,
        }
      );
    });


    // Settings endpoint.
    app.post("/dashboard/:guildID", checkAuth, async (req, res) => {
      // We validate the request, check if guild exists, member is in guild and if member has minimum permissions, if not, we redirect it back.
      const guild = client.guilds.cache.get(req.params.guildID);
      if (!guild) return res.redirect("/dashboard?error=" + encodeURIComponent("Can't get Guild Information Data!"));
      let member = guild.members.cache.get(req.user.id);
      if (!member) {
        try {
          member = await guild.members.fetch(req.user.id);
        } catch (err) {
          console.error(`Couldn't fetch ${req.user.id} in ${guild.name}: ${err}`);
        }
      }
      if (!member) return res.redirect("/dashboard?error=" + encodeURIComponent("Can't Information Data about you!"));
      if (!member.permissions.has("MANAGE_GUILD")) {
        return res.redirect("/dashboard?error=" + encodeURIComponent("You are not allowed to do that!"));
      }
      
      // Verificação de segurança para req.body
      if (!req.body) {
        console.error('[ERROR] req.body is undefined - Headers:', req.headers);
        return res.redirect("/dashboard?error=" + encodeURIComponent("Erro ao processar formulário"));
      }
      
      if(req.body.prefix) client.settings.set(guild.id, String(req.body.prefix).split(" ")[0], "prefix")
      if(req.body.defaultvolume) client.settings.set(guild.id, Number(req.body.defaultvolume), "defaultvolume")
      // Corrigir lógica do autoplay - só salvar se vier no formulário
      if(req.body.defaultautoplay !== undefined) {
        const autoplayValue = req.body.defaultautoplay === 'on' || req.body.defaultautoplay === 'true';
        client.settings.set(guild.id, autoplayValue, "defaultautoplay");
      }
      
      //mix default (spotify or youtube)
      if (req.body.mixDefault) {
        const validMixDefaults = ["spotify", "youtube"];
        const rawMixDefault = Array.isArray(req.body.mixDefault)
          ? String(req.body.mixDefault[0] || "")
          : String(req.body.mixDefault || "");
        const normalizedMixDefault = rawMixDefault.trim().toLowerCase();
        const mixDefault = validMixDefaults.includes(normalizedMixDefault) ? normalizedMixDefault : "youtube";
        client.settings.set(guild.id, mixDefault, "mixDefault");
      }
      
      // defaultfilters / roles / channels must always be stored as arrays
      const safeFilters = sanitizeDashboardFilters(req.body.defaultfilters);
      client.settings.set(guild.id, safeFilters, "defaultfilters");

      const activeQueue = client.distube.getQueue(guild.id);
      if (activeQueue?.filters && typeof activeQueue.filters.set === "function") {
        if (safeFilters.length) {
          await activeQueue.filters.set(safeFilters).catch(() => {});
        } else if (typeof activeQueue.filters.clear === "function") {
          await activeQueue.filters.clear().catch(() => {});
        }
      }

      const safeDjRoles = normalizeSettingsArray(req.body.djroles);
      client.settings.set(guild.id, safeDjRoles, "djroles");

      const safeBotChannels = normalizeSettingsArray(req.body.botchannel);
      client.settings.set(guild.id, safeBotChannels, "botchannel");

      const safeMusicChannels = normalizeSettingsArray(req.body.musicChannels);
      client.settings.set(guild.id, safeMusicChannels, "musicChannels");

      const safeModerationRoles = normalizeSettingsArray(req.body.moderationRoles);
      client.settings.set(guild.id, safeModerationRoles, "moderationRoles");

      const moderationLogEnabled = req.body.moderationLogEnabled === "on" || req.body.moderationLogEnabled === "true";
      const moderationLogType = req.body.moderationLogType === "webhook" ? "webhook" : "channel";
      client.settings.set(guild.id, moderationLogEnabled, "moderationLogEnabled");
      client.settings.set(guild.id, moderationLogType, "moderationLogType");

      const moderationLogChannelId = String(req.body.moderationLogChannelId || "").trim();
      if (moderationLogChannelId) {
        let modLogChannel = guild.channels.cache.get(moderationLogChannelId);
        if (!modLogChannel) {
          try {
            modLogChannel = await guild.channels.fetch(moderationLogChannelId);
          } catch {
            modLogChannel = null;
          }
        }

        const isTextBased = Boolean(modLogChannel && typeof modLogChannel.isTextBased === "function" && modLogChannel.isTextBased());
        const isThread = Boolean(modLogChannel && typeof modLogChannel.isThread === "function" && modLogChannel.isThread());
        const perms = modLogChannel ? modLogChannel.permissionsFor(client.user) : null;
        const hasSendPerms = Boolean(perms && perms.has(["ViewChannel", "SendMessages", "EmbedLinks"]));

        if (isTextBased && !isThread && hasSendPerms) {
          client.settings.set(guild.id, moderationLogChannelId, "moderationLogChannelId");
        }
      } else {
        client.settings.set(guild.id, null, "moderationLogChannelId");
      }

      const moderationLogWebhook = String(req.body.moderationLogWebhook || "").trim();
      if (moderationLogWebhook && moderationLogWebhook.startsWith("https://discord.com/api/webhooks/")) {
        client.settings.set(guild.id, moderationLogWebhook, "moderationLogWebhook");
      } else if (!moderationLogWebhook) {
        client.settings.set(guild.id, null, "moderationLogWebhook");
      }
      if (typeof req.body.confessionChannel === "string") {
        const requestedChannelId = req.body.confessionChannel.trim();
        if (!requestedChannelId) {
          client.settings.set(guild.id, null, "confessionChannel");
        } else {
          let confessionChannel = guild.channels.cache.get(requestedChannelId);
          if (!confessionChannel) {
            try {
              confessionChannel = await guild.channels.fetch(requestedChannelId);
            } catch {
              confessionChannel = null;
            }
          }

          const isTextBased = Boolean(confessionChannel && typeof confessionChannel.isTextBased === "function" && confessionChannel.isTextBased());
          const isThread = Boolean(confessionChannel && typeof confessionChannel.isThread === "function" && confessionChannel.isThread());
          const perms = confessionChannel ? confessionChannel.permissionsFor(client.user) : null;
          const hasSendPerms = Boolean(perms && perms.has(["ViewChannel", "SendMessages", "EmbedLinks"]));

          if (isTextBased && !isThread && hasSendPerms) {
            client.settings.set(guild.id, requestedChannelId, "confessionChannel");
          }
        }
      }
      // We render template using the absolute path of the template and the merged default data with the additional data provided.
      res.render("settings", {
          req: req,
          user: req.isAuthenticated() ? req.user : null,
          guild: client.guilds.cache.get(req.params.guildID),
          bot: getBotData(client),
          
          Permissions: Permissions,
          websiteInfo: websiteInfo,
          callback: resolveCallbackForRequest(req),
          categories: client.categories, 
          commands: client.commands, 
          BotConfig: BotConfig,
          BotFilters: BotFilters,
          SPOTIFY_MIXES: SPOTIFY_MIXES,
          YT_MIXES: YT_MIXES,
          BotEmojis: BotEmojis,
        }
      );
    });

    // Endpoint AJAX para atualização do autoplay
    app.post("/dashboard/:guildID/settings/autoplay", checkAuth, async (req, res) => {
      try {
        const guild = client.guilds.cache.get(req.params.guildID);
        if (!guild) {
          return res.json({ success: false, message: "Servidor não encontrado" });
        }

        const member = guild.members.cache.get(req.user.id);
        if (!member || !member.permissions.has("MANAGE_GUILD")) {
          return res.json({ success: false, message: "Você não tem permissão para isso" });
        }

        const { defaultautoplay } = req.body;
        
        // Validar o valor
        if (typeof defaultautoplay !== 'boolean') {
          return res.json({ success: false, message: "Valor inválido" });
        }

        // Salvar no banco de dados
        client.settings.set(guild.id, defaultautoplay, "defaultautoplay");

        // Aplicar à fila ativa se existir
        const activeQueue = client.distube.getQueue(guild.id);
        if (activeQueue && typeof activeQueue.toggleAutoplay === 'function') {
          try {
            if (activeQueue.autoplay !== defaultautoplay) {
              await activeQueue.toggleAutoplay();
            }
          } catch (error) {
            console.error('Erro ao atualizar autoplay na fila:', error);
          }
        }

        res.json({ 
          success: true, 
          message: `Reprodução automática ${defaultautoplay ? 'ativada' : 'desativada'} com sucesso.`
        });
      } catch (error) {
        console.error('Erro no endpoint de autoplay:', error);
        res.json({ 
          success: false, 
          message: 'Erro ao salvar configuração.' 
        });
      }
    });



    // Queue Dash
    app.get("/queue/:guildID", async (req,res) => {
      try {
        const guildId = String(req.params.guildID || "");
        const queue = client.distube.getQueue(guildId);
        if (queue?.songs?.[0] && client.lavalink?.ensureSongStats) {
          await client.lavalink.ensureSongStats(queue.songs[0]).catch(() => {});
        }
      } catch {
        // ignore stats errors
      }
      res.render("queue", {
        req: req,
        user: req.isAuthenticated() ? req.user : null,
        guild: client.guilds.cache.get(req.params.guildID),
        bot: getQueueBotData(client),
        Permissions: Permissions,
        websiteInfo: websiteInfo,
        callback: resolveCallbackForRequest(req),
        categories: client.categories, 
        commands: client.commands, 
        BotConfig: BotConfig,
        BotFilters: BotFilters,
          SPOTIFY_MIXES: SPOTIFY_MIXES,
          YT_MIXES: YT_MIXES,
        BotEmojis: BotEmojis,
      });
    })

    app.get("/api/queue/:guildID/lyrics", async (req, res) => {
      try {
        const guildId = String(req.params.guildID || "");
        const guild = client.guilds.cache.get(guildId);
        if (!guild) {
          return res.status(404).json({ ok: false, message: "Servidor nao encontrado." });
        }

        const queue = client.distube.getQueue(guildId);
        if (!queue || !Array.isArray(queue.songs) || queue.songs.length === 0) {
          return res.status(404).json({ ok: false, message: "Nao ha musica tocando agora." });
        }

        const currentSong = queue.songs[0];
        const query = getSongSearchData(currentSong);
        const result = await getLyricsWithFallback(query, {
          vagalumeApiKey: process.env.VAGALUME_API_KEY || process.env.VAGALUME_KEY || "",
        });

        if (!result?.lyrics) {
          return res.status(404).json({
            ok: false,
            message: "Nao encontrei letra para essa musica.",
            song: {
              title: query.title || currentSong.name || "",
              artist: query.artist || currentSong.uploader?.name || "",
            },
          });
        }

        return res.json({
          ok: true,
          song: {
            title: result.title || query.title || currentSong.name || "",
            artist: result.artist || query.artist || currentSong.uploader?.name || "",
            source: result.source || "desconhecida",
          },
          lyrics: result.lyrics,
        });
      } catch (err) {
        console.error(err);
        return res.status(500).json({
          ok: false,
          message: "Falha ao buscar a letra.",
          error: String(err?.message || err),
        });
      }
    });

    app.post("/api/queue/:guildID/control", checkApiAuth, async (req, res) => {
      try {
        const guildId = String(req.params.guildID || "");
        const guild = client.guilds.cache.get(guildId);
        if (!guild) {
          return res.status(404).json({ ok: false, message: "Servidor nao encontrado." });
        }

        if (!userCanManageGuild(req, guildId)) {
          return res.status(403).json({ ok: false, message: "Voce nao tem permissao para controlar esta fila." });
        }

        let queue = client.distube.getQueue(guildId);
        if (!queue || !Array.isArray(queue.songs) || queue.songs.length === 0) {
          return res.status(400).json({ ok: false, message: "Nao ha musica tocando agora." });
        }

        const action = String(req.body?.action || "").trim();
        let message = "Acao executada.";
        const formatClock = (totalSeconds) => {
          const safe = Math.max(0, Number(totalSeconds) || 0);
          const h = Math.floor(safe / 3600);
          const m = Math.floor((safe % 3600) / 60);
          const s = Math.floor(safe % 60);
          if (h > 0) return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
          return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
        };

        switch (action) {
          case "toggle_pause": {
            if (queue.paused) {
              await queue.resume();
              message = "Reproducao retomada.";
            } else {
              await queue.pause();
              message = "Reproducao pausada.";
            }
            break;
          }
          case "skip": {
            await queue.skip();
            message = "Musica pulada.";
            break;
          }
          case "previous": {
            if (!Array.isArray(queue.previousSongs) || queue.previousSongs.length === 0) {
              return res.status(400).json({ ok: false, message: "Nao ha musica anterior." });
            }
            await queue.previous();
            message = "Voltando para a musica anterior.";
            break;
          }
          case "shuffle": {
            await queue.shuffle();
            message = "Fila embaralhada.";
            break;
          }
          case "toggle_autoplay": {
            await queue.toggleAutoplay();
            message = queue.autoplay ? "Autoplay ativado." : "Autoplay desativado.";
            break;
          }
          case "loop_cycle": {
            const nextMode = queue.repeatMode === 2 ? 0 : queue.repeatMode + 1;
            await queue.setRepeatMode(nextMode);
            message = nextMode === 2 ? "Loop da fila ativado." : nextMode === 1 ? "Loop da musica ativado." : "Loop desativado.";
            break;
          }
          case "stop": {
            await queue.stop();
            message = "Fila encerrada.";
            break;
          }
          case "play_index": {
            const index = Number(req.body?.index);
            if (!Number.isInteger(index) || index < 0 || index >= queue.songs.length) {
              return res.status(400).json({ ok: false, message: "Indice de musica invalido." });
            }
            if (index === 0) {
              await queue.seek(0);
              message = "Reiniciando musica atual.";
            } else {
              await queue.jump(index);
              message = `Tocando a musica #${index + 1}.`;
            }
            break;
          }
          case "seek_seconds": {
            const currentSong = queue.songs?.[0];
            const duration = Number(currentSong?.duration || 0);
            if (!Number.isFinite(duration) || duration <= 0) {
              return res.status(400).json({ ok: false, message: "Esta musica nao permite alterar o tempo." });
            }
            const rawSeconds = Number(req.body?.seconds);
            if (!Number.isFinite(rawSeconds)) {
              return res.status(400).json({ ok: false, message: "Tempo invalido para seek." });
            }
            const maxSeek = Math.max(0, Math.floor(duration) - 1);
            const target = Math.min(maxSeek, Math.max(0, Math.floor(rawSeconds)));
            await queue.seek(target);
            message = `Tempo ajustado para ${formatClock(target)}.`;
            break;
          }
          default:
            return res.status(400).json({ ok: false, message: "Acao invalida." });
        }

        queue = client.distube.getQueue(guildId);
        const hasQueue = Boolean(queue && Array.isArray(queue.songs) && queue.songs.length);
        return res.json({ ok: true, message, hasQueue });
      } catch (err) {
        console.error(err);
        return res.status(500).json({
          ok: false,
          message: "Falha ao executar controle da fila.",
          error: String(err?.message || err)
        });
      }
    });


    //Queue Dashes
    app.get("/queuedashboard", checkAuth, async (req,res) => {
      if(!req.isAuthenticated() || !req.user) 
      return res.redirect("/?error=" + encodeURIComponent("Login First!"));
      if(!req.user.guilds)
      return res.redirect("/?error=" + encodeURIComponent("Unable to get your Guilds!"));
      res.render("queuedashboard", {
        req: req,
        user: req.isAuthenticated() ? req.user : null,
        //guild: client.guilds.cache.get(req.params.guildID),
        bot: getBotData(client),
        Permissions: Permissions,
        websiteInfo: websiteInfo,
        callback: resolveCallbackForRequest(req),
        categories: client.categories, 
        commands: client.commands, 
        BotConfig: BotConfig,
        BotFilters: BotFilters,
          SPOTIFY_MIXES: SPOTIFY_MIXES,
          YT_MIXES: YT_MIXES,
        BotEmojis: BotEmojis,
      });
    })

    // ===============================
    // TICKETS DASHBOARD
    // ===============================
    app.get("/dashboard/:guildID/tickets", checkAuth, async (req, res) => {
      const guild = client.guilds.cache.get(req.params.guildID);
      if (!guild) return res.redirect("/dashboard?error=" + encodeURIComponent("Servidor não encontrado"));
      
      let member = guild.members.cache.get(req.user.id);
      if (!member) {
        try { member = await guild.members.fetch(req.user.id); } 
        catch (err) { console.error(err); }
      }
      if (!member) return res.redirect("/dashboard?error=" + encodeURIComponent("Não foi possível obter seus dados"));
      if (!member.permissions.has("MANAGE_GUILD")) {
        return res.redirect("/dashboard?error=" + encodeURIComponent("Você não tem permissão para isso"));
      }

      client.settings.ensure(guild.id, {
        ticketCategory: null,
        ticketRoles: [],
        ticketWebhook: null,
        ticketPanels: []
      });

      const TicketHandler = require("../handlers/tickets");
      if (!client.ticketHandler) {
        client.ticketHandler = new TicketHandler(client);
      }

      const tickets = client.ticketHandler.getGuildTickets(guild.id);
      const panels = client.ticketHandler.getGuildPanels(guild.id);
      const history = client.ticketHandler.getHistory(guild.id, 100);

      const ticketLogOpenEnabled = client.settings.get(guild.id, "ticketLogOpenEnabled");
      const ticketLogCloseEnabled = client.settings.get(guild.id, "ticketLogCloseEnabled");
      const ticketLogOpenType = client.settings.get(guild.id, "ticketLogOpenType") || "channel";
      const ticketLogCloseType = client.settings.get(guild.id, "ticketLogCloseType") || "channel";
      const ticketLogOpenChannel = client.settings.get(guild.id, "ticketLogOpenChannel");
      const ticketLogCloseChannel = client.settings.get(guild.id, "ticketLogCloseChannel");
      const ticketLogOpenWebhook = client.settings.get(guild.id, "ticketLogOpenWebhook");
      const ticketLogCloseWebhook = client.settings.get(guild.id, "ticketLogCloseWebhook");
      const settingsSaved = req.query.success === "settings";

      res.render("tickets", {
        req: req,
        user: req.isAuthenticated() ? req.user : null,
        guild: guild,
        bot: getBotData(client),
        Permissions: Permissions,
        websiteInfo: websiteInfo,
        callback: resolveCallbackForRequest(req),
        categories: client.categories,
        commands: client.commands,
        BotConfig: BotConfig,
        BotFilters: BotFilters,
        SPOTIFY_MIXES: SPOTIFY_MIXES,
        YT_MIXES: YT_MIXES,
        BotEmojis: BotEmojis,
        openTickets: tickets.open || [],
        closedTickets: tickets.closed || [],
        totalTickets: tickets.total || 0,
        panels: panels || [],
        ticketHistory: history || [],
        ticketRoles: client.settings.get(guild.id, "ticketRoles") || [],
        guildRoles: guild.roles.cache.filter(r => !r.managed).sort((a, b) => b.rawPosition - a.rawPosition).map(r => ({ id: r.id, name: r.name, color: r.color })),
        ticketLogOpenEnabled: ticketLogOpenEnabled || false,
        ticketLogCloseEnabled: ticketLogCloseEnabled || false,
        ticketLogOpenType: ticketLogOpenType,
        ticketLogCloseType: ticketLogCloseType,
        ticketLogOpenChannel: ticketLogOpenChannel || "",
        ticketLogCloseChannel: ticketLogCloseChannel || "",
        ticketLogOpenWebhook: ticketLogOpenWebhook || "",
        ticketLogCloseWebhook: ticketLogCloseWebhook || "",
        settingsSaved: settingsSaved
      });
    });

    app.post("/dashboard/:guildID/tickets/settings", checkAuth, async (req, res) => {
      const guild = client.guilds.cache.get(req.params.guildID);
      if (!guild) return res.redirect("/dashboard?error=" + encodeURIComponent("Servidor não encontrado"));
      
      let member = guild.members.cache.get(req.user.id);
      if (!member) {
        try { member = await guild.members.fetch(req.user.id); } catch (err) { console.error(err); }
      }
      if (!member) return res.redirect("/dashboard?error=" + encodeURIComponent("Não foi possível obter seus dados"));
      if (!member.permissions.has("MANAGE_GUILD")) {
        return res.redirect("/dashboard?error=" + encodeURIComponent("Você não tem permissão para isso"));
      }

      const supportRoles = req.body.ticketRoles;
      if (Array.isArray(supportRoles)) {
        client.settings.set(guild.id, supportRoles, "ticketRoles");
      } else if (supportRoles) {
        client.settings.set(guild.id, [supportRoles], "ticketRoles");
      } else {
        client.settings.set(guild.id, [], "ticketRoles");
      }

      client.settings.set(guild.id, !!req.body.ticketLogOpenEnabled, "ticketLogOpenEnabled");
      client.settings.set(guild.id, !!req.body.ticketLogCloseEnabled, "ticketLogCloseEnabled");
      client.settings.set(guild.id, (req.body.ticketLogOpenType === "webhook") ? "webhook" : "channel", "ticketLogOpenType");
      client.settings.set(guild.id, (req.body.ticketLogCloseType === "webhook") ? "webhook" : "channel", "ticketLogCloseType");
      
      const openChannel = String(req.body.ticketLogOpenChannel || "").trim();
      const closeChannel = String(req.body.ticketLogCloseChannel || "").trim();
      const openWebhook = String(req.body.ticketLogOpenWebhook || "").trim();
      const closeWebhook = String(req.body.ticketLogCloseWebhook || "").trim();

      if (openChannel) {
        let ch = guild.channels.cache.get(openChannel);
        if (!ch) {
          try { ch = await guild.channels.fetch(openChannel); } catch (e) {}
        }
        if (ch && typeof ch.isTextBased === "function" && ch.isTextBased()) {
          client.settings.set(guild.id, openChannel, "ticketLogOpenChannel");
        }
      } else {
        client.settings.set(guild.id, null, "ticketLogOpenChannel");
      }
      if (closeChannel) {
        let ch = guild.channels.cache.get(closeChannel);
        if (!ch) {
          try { ch = await guild.channels.fetch(closeChannel); } catch (e) {}
        }
        if (ch && typeof ch.isTextBased === "function" && ch.isTextBased()) {
          client.settings.set(guild.id, closeChannel, "ticketLogCloseChannel");
        }
      } else {
        client.settings.set(guild.id, null, "ticketLogCloseChannel");
      }
      if (openWebhook && openWebhook.startsWith("https://discord.com/api/webhooks/")) {
        client.settings.set(guild.id, openWebhook, "ticketLogOpenWebhook");
      } else if (!openWebhook) {
        client.settings.set(guild.id, null, "ticketLogOpenWebhook");
      }
      if (closeWebhook && closeWebhook.startsWith("https://discord.com/api/webhooks/")) {
        client.settings.set(guild.id, closeWebhook, "ticketLogCloseWebhook");
      } else if (!closeWebhook) {
        client.settings.set(guild.id, null, "ticketLogCloseWebhook");
      }

      return res.redirect("/dashboard/" + guild.id + "/tickets?success=settings");
    });

    // Embed Editor Page
    app.get("/dashboard/:guildID/tickets/embed", checkAuth, async (req, res) => {
      const guild = client.guilds.cache.get(req.params.guildID);
      if (!guild) return res.redirect("/dashboard?error=" + encodeURIComponent("Servidor não encontrado"));
      
      let member = guild.members.cache.get(req.user.id);
      if (!member) {
        try { member = await guild.members.fetch(req.user.id); } 
        catch (err) { console.error(err); }
      }
      if (!member) return res.redirect("/dashboard?error=" + encodeURIComponent("Não foi possível obter seus dados"));
      if (!member.permissions.has("MANAGE_GUILD")) {
        return res.redirect("/dashboard?error=" + encodeURIComponent("Você não tem permissão para isso"));
      }

      const welcomeEmbed = client.settings.get(guild.id, "ticketWelcomeEmbed") || null;
      const closeEmbed = client.settings.get(guild.id, "ticketCloseEmbed") || null;
      const returnTo = resolveEmbedReturnTo(guild.id, req.query.returnTo || req?.session?.ticketEmbedReturnTo);
      if (req?.session) req.session.ticketEmbedReturnTo = returnTo;

      res.render("tickets-embed", {
        req: req,
        user: req.isAuthenticated() ? req.user : null,
        guild: guild,
        bot: getBotData(client),
        Permissions: Permissions,
        websiteInfo: websiteInfo,
        callback: resolveCallbackForRequest(req),
        categories: client.categories,
        commands: client.commands,
        BotConfig: BotConfig,
        BotFilters: BotFilters,
        SPOTIFY_MIXES: SPOTIFY_MIXES,
        YT_MIXES: YT_MIXES,
        BotEmojis: BotEmojis,
        returnTo: returnTo,
        welcomeEmbed: welcomeEmbed,
        closeEmbed: closeEmbed
      });
    });

    app.post("/dashboard/:guildID/tickets/embed", checkAuth, async (req, res) => {
      const guild = client.guilds.cache.get(req.params.guildID);
      if (!guild) return res.redirect("/dashboard?error=" + encodeURIComponent("Servidor não encontrado"));
      const returnTo = resolveEmbedReturnTo(guild.id, req.body.returnTo || req.query.returnTo || req?.session?.ticketEmbedReturnTo);
      if (req?.session) req.session.ticketEmbedReturnTo = returnTo;
      
      let member = guild.members.cache.get(req.user.id);
      if (!member) {
        try { member = await guild.members.fetch(req.user.id); } 
        catch (err) { console.error(err); }
      }
      if (!member) return res.redirect("/dashboard?error=" + encodeURIComponent("Não foi possível obter seus dados"));
      if (!member.permissions.has("MANAGE_GUILD")) {
        return res.redirect("/dashboard?error=" + encodeURIComponent("Você não tem permissão para isso"));
      }

      try {
        if (req.body.welcomeEmbed) {
          const welcomeData = JSON.parse(req.body.welcomeEmbed);
          client.settings.set(guild.id, welcomeData, "ticketWelcomeEmbed");
        }

        if (req.body.closeEmbed) {
          const closeData = JSON.parse(req.body.closeEmbed);
          client.settings.set(guild.id, closeData, "ticketCloseEmbed");
        }

        res.redirect(`/dashboard/${guild.id}/tickets/embed?success=` + encodeURIComponent("Embed salva com sucesso!") + `&returnTo=${encodeURIComponent(returnTo)}`);
      } catch (err) {
        console.error("[Embed] Erro ao salvar embed:", err);
        res.redirect(`/dashboard/${guild.id}/tickets/embed?error=` + encodeURIComponent("Erro ao salvar embed") + `&returnTo=${encodeURIComponent(returnTo)}`);
      }
    });

    app.get("/tickets/:guildID/:ticketNumber", checkAuth, async (req, res) => {
      const guild = client.guilds.cache.get(req.params.guildID);
      if (!guild) return res.redirect("/dashboard?error=" + encodeURIComponent("Servidor não encontrado"));
      
      let member = guild.members.cache.get(req.user.id);
      if (!member) {
        try { member = await guild.members.fetch(req.user.id); } 
        catch (err) { console.error(err); }
      }
      if (!member) return res.redirect("/dashboard?error=" + encodeURIComponent("Não foi possível obter seus dados"));
      if (!member.permissions.has("MANAGE_GUILD")) {
        return res.redirect("/dashboard?error=" + encodeURIComponent("Você não tem permissão para isso"));
      }

      const ticketNumber = parseInt(req.params.ticketNumber);
      if (!ticketNumber) return res.redirect("/dashboard?error=" + encodeURIComponent("Ticket inválido"));

      const TicketHandler = require("../handlers/tickets");
      if (!client.ticketHandler) {
        client.ticketHandler = new TicketHandler(client);
      }

      const ticket = client.ticketHandler.getTicket(guild.id, ticketNumber);
      if (!ticket) return res.redirect(`/dashboard/${guild.id}/tickets?error=` + encodeURIComponent("Ticket não encontrado"));

      res.render("ticket-view", {
        req: req,
        user: req.isAuthenticated() ? req.user : null,
        guild: guild,
        bot: getBotData(client),
        Permissions: Permissions,
        websiteInfo: websiteInfo,
        ticket: ticket
      });
    });

    // API para gerenciar tickets
    app.post("/api/tickets/:guildID/:ticketNumber/close", checkApiAuth, async (req, res) => {
      try {
        const guildId = req.params.guildID;
        const ticketNumber = parseInt(req.params.ticketNumber);
        
        const guild = client.guilds.cache.get(guildId);
        if (!guild) {
          return res.status(404).json({ ok: false, message: "Servidor não encontrado" });
        }

        if (!userCanManageGuild(req, guildId)) {
          return res.status(403).json({ ok: false, message: "Você não tem permissão" });
        }

        const TicketHandler = require("../handlers/tickets");
        if (!client.ticketHandler) {
          client.ticketHandler = new TicketHandler(client);
        }

        const closedTicket = await client.ticketHandler.closeTicket(guildId, ticketNumber, req.user.id, req.user.tag);

        await client.ticketHandler.sendCloseLog(guildId, closedTicket, guild, req.user);

        return res.json({ ok: true, message: "Ticket fechado com sucesso" });
      } catch (err) {
        console.error(err);
        return res.status(500).json({ ok: false, message: "Erro ao fechar ticket" });
      }
    });

    app.post("/api/tickets/:guildID/:ticketNumber/reopen", checkApiAuth, async (req, res) => {
      try {
        const guildId = req.params.guildID;
        const ticketNumber = parseInt(req.params.ticketNumber);
        
        const guild = client.guilds.cache.get(guildId);
        if (!guild) {
          return res.status(404).json({ ok: false, message: "Servidor não encontrado" });
        }

        if (!userCanManageGuild(req, guildId)) {
          return res.status(403).json({ ok: false, message: "Você não tem permissão" });
        }

        const TicketHandler = require("../handlers/tickets");
        if (!client.ticketHandler) {
          client.ticketHandler = new TicketHandler(client);
        }

        await client.ticketHandler.reopenTicket(guildId, ticketNumber);

        return res.json({ ok: true, message: "Ticket reaberto com sucesso" });
      } catch (err) {
        console.error(err);
        return res.status(500).json({ ok: false, message: "Erro ao reopen ticket" });
      }
    });

    // API para criar painel de tickets
    app.post("/api/tickets/:guildID/create-panel", checkApiAuth, async (req, res) => {
      try {
        const guildId = req.params.guildID;
        const { channelId, title, description, buttonLabel } = req.body;
        
        const guild = client.guilds.cache.get(guildId);
        if (!guild) {
          return res.status(404).json({ ok: false, message: "Servidor não encontrado" });
        }

        if (!userCanManageGuild(req, guildId)) {
          return res.status(403).json({ ok: false, message: "Você não tem permissão" });
        }

        const channel = guild.channels.cache.get(channelId);
        const isTextChannel = channel && (
          channel.type === 0 ||
          channel.type === "GUILD_TEXT" ||
          channel.type === "text" ||
          (typeof channel.isTextBased === "function" && channel.isTextBased())
        );
        if (!isTextChannel) {
          return res.status(400).json({ ok: false, message: "Canal de texto inválido" });
        }

        const { MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");

        const embed = new MessageEmbed()
          .setColor("#00BFFF")
          .setTitle(title || "🎫 Central de Tickets")
          .setDescription(description || "Precisa de ajuda? Clique no botão abaixo para criar um ticket.")
          .setFooter({ text: "Sistema de Tickets" });

        const row = new MessageActionRow()
          .addComponents(
            new MessageButton()
              .setCustomId("create_ticket")
              .setLabel(buttonLabel || "🎫 Criar Ticket")
              .setStyle("PRIMARY")
          );

        const panelMessage = await channel.send({
          embeds: [embed],
          components: [row]
        });

        const TicketHandler = require("../handlers/tickets");
        if (!client.ticketHandler) {
          client.ticketHandler = new TicketHandler(client);
        }

        await client.ticketHandler.createPanel(guildId, {
          channelId: channelId,
          messageId: panelMessage.id,
          title: title,
          description: description,
          buttonLabel: buttonLabel
        });

        return res.json({ ok: true, message: "Painel criado com sucesso" });
      } catch (err) {
        console.error("[Create Panel] Erro:", err);
        return res.status(500).json({ ok: false, message: "Erro ao criar painel" });
      }
    });

    // API para excluir painel de tickets
    app.post("/api/tickets/:guildID/delete-panel", checkApiAuth, async (req, res) => {
      try {
        const guildId = req.params.guildID;
        const { panelId } = req.body;
        
        const guild = client.guilds.cache.get(guildId);
        if (!guild) {
          return res.status(404).json({ ok: false, message: "Servidor não encontrado" });
        }

        if (!userCanManageGuild(req, guildId)) {
          return res.status(403).json({ ok: false, message: "Você não tem permissão" });
        }

        const TicketHandler = require("../handlers/tickets");
        if (!client.ticketHandler) {
          client.ticketHandler = new TicketHandler(client);
        }

        const panels = client.ticketHandler.getGuildPanels(guildId);
        const panel = panels.find(p => p.id === panelId);
        
        if (panel) {
          try {
            const channel = guild.channels.cache.get(panel.channelId);
            if (channel) {
              const message = await channel.messages.fetch(panel.messageId).catch(() => null);
              if (message) {
                await message.delete();
              }
            }
          } catch (e) {
            console.log("[Delete Panel] Não foi possível deletar a mensagem:", e.message);
          }

          await client.ticketHandler.deletePanel(guildId, panel.id);
        }

        return res.json({ ok: true, message: "Painel excluído com sucesso" });
      } catch (err) {
        console.error("[Delete Panel] Erro:", err);
        return res.status(500).json({ ok: false, message: "Erro ao excluir painel" });
      }
    });

    // API para reenviar painel
    app.post("/api/tickets/:guildID/resend-panel", checkApiAuth, async (req, res) => {
      try {
        const guildId = req.params.guildID;
        const { panelId } = req.body;
        
        const guild = client.guilds.cache.get(guildId);
        if (!guild) {
          return res.status(404).json({ ok: false, message: "Servidor não encontrado" });
        }

        if (!userCanManageGuild(req, guildId)) {
          return res.status(403).json({ ok: false, message: "Você não tem permissão" });
        }

        const TicketHandler = require("../handlers/tickets");
        if (!client.ticketHandler) {
          client.ticketHandler = new TicketHandler(client);
        }

        const panels = client.ticketHandler.getGuildPanels(guildId);
        const panel = panels.find(p => p.id === panelId);
        
        if (!panel) {
          return res.status(404).json({ ok: false, message: "Painel não encontrado" });
        }

        const channel = guild.channels.cache.get(panel.channelId);
        if (!channel) {
          return res.status(400).json({ ok: false, message: "Canal do painel não encontrado" });
        }

        const { MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");

        const discordEmbeds = (panel.embeds || []).map(embed => {
          const e = new MessageEmbed();
          if (embed.color) e.setColor(embed.color);
          if (embed.title) e.setTitle(embed.title);
          if (embed.description) e.setDescription(embed.description);
          if (embed.url) e.setURL(embed.url);
          if (embed.image) e.setImage(embed.image);
          if (embed.thumbnail) e.setThumbnail(embed.thumbnail);
          if (embed.author?.name) {
            e.setAuthor({
              name: embed.author.name,
              url: embed.author.url || null,
              iconURL: embed.author.icon_url || null
            });
          }
          if (embed.footer?.text) {
            e.setFooter({
              text: embed.footer.text,
              iconURL: embed.footer.icon_url || null
            });
          }
          return e;
        });

        const rows = [];
        const buttonRow = new MessageActionRow();
        
        (panel.buttons || []).forEach(btn => {
          const button = new MessageButton()
            .setCustomId(btn.customId || 'create_ticket')
            .setLabel(btn.label || 'Criar Ticket')
            .setStyle(btn.style || 'PRIMARY');
          if (btn.emoji) button.setEmoji(btn.emoji);
          buttonRow.addComponents(button);
        });

        if (buttonRow.components.length > 0) {
          rows.push(buttonRow);
        }

        await channel.send({
          embeds: discordEmbeds,
          components: rows
        });

        return res.json({ ok: true, message: "Painel reenviado com sucesso" });
      } catch (err) {
        console.error("[Resend Panel] Erro:", err);
        return res.status(500).json({ ok: false, message: "Erro ao reenviar painel: " + err.message });
      }
    });

    // API para fechar ticket
    app.post("/api/tickets/:guildID/close", checkApiAuth, async (req, res) => {
      try {
        const guildId = req.params.guildID;
        const { ticketNumber } = req.body;
        
        const guild = client.guilds.cache.get(guildId);
        if (!guild) {
          return res.status(404).json({ ok: false, message: "Servidor não encontrado" });
        }

        if (!userCanManageGuild(req, guildId)) {
          return res.status(403).json({ ok: false, message: "Você não tem permissão" });
        }

        const TicketHandler = require("../handlers/tickets");
        if (!client.ticketHandler) {
          client.ticketHandler = new TicketHandler(client);
        }

        const ticket = client.ticketHandler.getTicket(guildId, ticketNumber);
        if (!ticket) {
          return res.status(404).json({ ok: false, message: "Ticket não encontrado" });
        }

        if (ticket.status === "closed") {
          return res.status(400).json({ ok: false, message: "Ticket já está fechado" });
        }

        const closedTicket = await client.ticketHandler.closeTicket(
          guildId,
          ticketNumber,
          req.user.id,
          req.user.tag
        );

        await client.ticketHandler.sendCloseLog(guildId, closedTicket, guild, req.user);

        const channel = guild.channels.cache.get(ticket.channelId);
        if (channel) {
          await channel.setName(`closed-${ticketNumber}`);

          const { MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");

          const customCloseEmbed = client.settings.get(guild.id, "ticketCloseEmbed");
          let embed;

          if (customCloseEmbed) {
            embed = new MessageEmbed();
            if (customCloseEmbed.color) embed.setColor(customCloseEmbed.color);
            if (customCloseEmbed.title) embed.setTitle(customCloseEmbed.title);
            if (customCloseEmbed.description) embed.setDescription(
              customCloseEmbed.description
                .replace(/{user}/g, `<@${ticket.userId}>`)
                .replace(/{username}/g, ticket.userTag || "Unknown")
                .replace(/{ticket}/g, `#${ticketNumber}`)
                .replace(/{usertag}/g, ticket.userTag || "Unknown")
                .replace(/{closer}/g, req.user.tag)
            );
            if (customCloseEmbed.footer?.text) embed.setFooter({ text: customCloseEmbed.footer.text, iconURL: customCloseEmbed.footer.icon_url || null });
            if (customCloseEmbed.image) embed.setImage(customCloseEmbed.image);
            if (customCloseEmbed.thumbnail) embed.setThumbnail(customCloseEmbed.thumbnail);
            if (customCloseEmbed.author?.name) embed.setAuthor({ name: customCloseEmbed.author.name, url: customCloseEmbed.author.url || null, iconURL: customCloseEmbed.author.icon_url || null });
            if (customCloseEmbed.fields?.length) customCloseEmbed.fields.forEach(f => { if (f.name) embed.addField(f.name, f.value || '\u200b', f.inline || false); });
            embed.addField("🎫 Ticket", `#${ticketNumber}`, true);
            embed.addField("👤 Fechado por", req.user.tag, true);
            embed.setTimestamp();
          } else {
            embed = new MessageEmbed()
              .setColor("#ed4245")
              .setTitle("🎫 Ticket Fechado")
              .setDescription(`Ticket fechado por ${req.user.tag}.`)
              .addField("Ticket", `#${ticketNumber}`, true)
              .setTimestamp();
          }

          await channel.send({ embeds: [embed] });

          const row = new MessageActionRow()
            .addComponents(
              new MessageButton()
                .setCustomId("reopen_ticket")
                .setLabel("🔓 Reabrir")
                .setStyle("SECONDARY"),
              new MessageButton()
                .setCustomId("delete_ticket")
                .setLabel("🗑️ Deletar")
                .setStyle("DANGER")
            );

          await channel.send({
            content: "Ticket fechado. Escolha uma opção:",
            components: [row]
          });
        }

        return res.json({ ok: true, message: "Ticket fechado com sucesso" });
      } catch (err) {
        console.error("[Close Ticket API] Erro:", err);
        return res.status(500).json({ ok: false, message: "Erro ao fechar ticket: " + err.message });
      }
    });

    // Page para criar painel avançado
    app.get("/dashboard/:guildID/tickets/create", checkAuth, async (req, res) => {
      const guild = client.guilds.cache.get(req.params.guildID);
      if (!guild) return res.redirect("/dashboard?error=" + encodeURIComponent("Servidor não encontrado"));
      
      let member = guild.members.cache.get(req.user.id);
      if (!member) {
        try { member = await guild.members.fetch(req.user.id); } 
        catch (err) { console.error(err); }
      }
      if (!member) return res.redirect("/dashboard?error=" + encodeURIComponent("Não foi possível obter seus dados"));
      if (!member.permissions.has("MANAGE_GUILD")) {
        return res.redirect("/dashboard?error=" + encodeURIComponent("Você não tem permissão para isso"));
      }

      res.render("create-panel", {
        req: req,
        user: req.isAuthenticated() ? req.user : null,
        guild: guild,
        bot: getBotData(client),
        Permissions: Permissions,
        websiteInfo: websiteInfo,
        callback: resolveCallbackForRequest(req),
        categories: client.categories,
        commands: client.commands,
        BotConfig: BotConfig,
        BotFilters: BotFilters,
        SPOTIFY_MIXES: SPOTIFY_MIXES,
        YT_MIXES: YT_MIXES,
        BotEmojis: BotEmojis,
        editPanel: null
      });
    });

    // Page para editar painel
    app.get("/dashboard/:guildID/tickets/edit/:panelId", checkAuth, async (req, res) => {
      const guild = client.guilds.cache.get(req.params.guildID);
      if (!guild) return res.redirect("/dashboard?error=" + encodeURIComponent("Servidor não encontrado"));
      
      let member = guild.members.cache.get(req.user.id);
      if (!member) {
        try { member = await guild.members.fetch(req.user.id); } 
        catch (err) { console.error(err); }
      }
      if (!member) return res.redirect("/dashboard?error=" + encodeURIComponent("Não foi possível obter seus dados"));
      if (!member.permissions.has("MANAGE_GUILD")) {
        return res.redirect("/dashboard?error=" + encodeURIComponent("Você não tem permissão para isso"));
      }

      const TicketHandler = require("../handlers/tickets");
      if (!client.ticketHandler) {
        client.ticketHandler = new TicketHandler(client);
      }

      const panels = client.ticketHandler.getGuildPanels(guild.id);
      const panel = panels.find(p => p.id === req.params.panelId);
      
      if (!panel) {
        return res.redirect("/dashboard/" + guild.id + "/tickets?error=" + encodeURIComponent("Painel não encontrado"));
      }

      res.render("create-panel", {
        req: req,
        user: req.isAuthenticated() ? req.user : null,
        guild: guild,
        bot: getBotData(client),
        Permissions: Permissions,
        websiteInfo: websiteInfo,
        callback: resolveCallbackForRequest(req),
        categories: client.categories,
        commands: client.commands,
        BotConfig: BotConfig,
        BotFilters: BotFilters,
        SPOTIFY_MIXES: SPOTIFY_MIXES,
        YT_MIXES: YT_MIXES,
        BotEmojis: BotEmojis,
        editPanel: panel
      });
    });

    // API para criar painel avançado
    app.post("/api/tickets/:guildID/create-panel-advanced", checkApiAuth, async (req, res) => {
      try {
        const guildId = req.params.guildID;
        const { channelId, categoryId, categoryEnabled, embeds, buttons, logs, questions } = req.body;
        
        const guild = client.guilds.cache.get(guildId);
        if (!guild) {
          return res.status(404).json({ ok: false, message: "Servidor não encontrado" });
        }

        if (!userCanManageGuild(req, guildId)) {
          return res.status(403).json({ ok: false, message: "Você não tem permissão" });
        }

        const channel = guild.channels.cache.get(channelId);
        const isTextChannel = channel && (
          channel.type === 0 ||
          channel.type === "GUILD_TEXT" ||
          channel.type === "text" ||
          (typeof channel.isTextBased === "function" && channel.isTextBased())
        );
        if (!isTextChannel) {
          return res.status(400).json({ ok: false, message: "Canal de texto inválido" });
        }

        const useCategory = Boolean(categoryEnabled);
        let finalCategoryId = useCategory ? categoryId : null;
        if (finalCategoryId === "" || finalCategoryId === undefined) {
          finalCategoryId = null;
        }
        if (finalCategoryId) {
          const category = guild.channels.cache.get(finalCategoryId);
          const isCategory = category && (
            category.type === 4 ||
            category.type === "GUILD_CATEGORY" ||
            category.type === "category"
          );
          if (!isCategory) {
            finalCategoryId = null;
          }
        }

        const { MessageEmbed, MessageActionRow, MessageButton, ComponentType } = require("discord.js");
        const resolvedPanelLogs = await resolveValidatedPanelLogs(guild, logs);
        if (!resolvedPanelLogs.ok) {
          return res.status(400).json({ ok: false, message: resolvedPanelLogs.message });
        }

        const discordEmbeds = embeds.map(embed => {
          const e = new MessageEmbed();
          if (embed.color) e.setColor(embed.color);
          if (embed.title) e.setTitle(embed.title);
          if (embed.description) e.setDescription(embed.description);
          if (embed.url) e.setURL(embed.url);
          if (embed.image) e.setImage(embed.image);
          if (embed.thumbnail) e.setThumbnail(embed.thumbnail);
          if (embed.author?.name) {
            e.setAuthor({
              name: embed.author.name,
              url: embed.author.url || null,
              iconURL: embed.author.icon_url || null
            });
          }
          if (embed.footer?.text) {
            e.setFooter({
              text: embed.footer.text,
              iconURL: embed.footer.icon_url || null
            });
          }
          return e;
        });

        const panelId = `panel-${Date.now()}`;

        const rows = [];
        const buttonRow = new MessageActionRow();
        
        buttons.forEach(btn => {
          const customId = btn.customId && btn.customId !== 'create_ticket' 
            ? btn.customId 
            : `create_ticket_${panelId}`;
          const button = new MessageButton()
            .setCustomId(customId)
            .setLabel(btn.label || 'Criar Ticket')
            .setStyle(btn.style || 'PRIMARY');
          if (btn.emoji) button.setEmoji(btn.emoji);
          buttonRow.addComponents(button);
        });

        if (buttonRow.components.length > 0) {
          rows.push(buttonRow);
        }

        const panelMessage = await channel.send({
          embeds: discordEmbeds,
          components: rows
        });

        const TicketHandler = require("../handlers/tickets");
        if (!client.ticketHandler) {
          client.ticketHandler = new TicketHandler(client);
        }

        const updatedButtons = buttons.map(btn => ({
          ...btn,
          customId: btn.customId && btn.customId !== 'create_ticket' 
            ? btn.customId 
            : `create_ticket_${panelId}`
        }));

        await client.ticketHandler.createPanel(guildId, {
          channelId: channelId,
          useCategory,
          categoryId: finalCategoryId,
          logs: resolvedPanelLogs.value,
          messageId: panelMessage.id,
          panelId: panelId,
          embeds: embeds,
          buttons: updatedButtons,
          questions: questions || []
        });

        client.settings.ensure(guildId, {
          ticketCategory: null,
          ticketRoles: [],
          ticketWebhook: null
        });
        
        return res.json({ ok: true, message: "Painel criado com sucesso" });
      } catch (err) {
        console.error("[Create Panel Advanced] Erro:", err);
        return res.status(500).json({ ok: false, message: "Erro ao criar painel: " + err.message });
      }
    });

    // API para atualizar painel
    app.post("/api/tickets/:guildID/update-panel", checkApiAuth, async (req, res) => {
      try {
        const guildId = req.params.guildID;
        const { panelId, channelId, categoryId, categoryEnabled, embeds, buttons, logs, questions } = req.body;
        
        const guild = client.guilds.cache.get(guildId);
        if (!guild) {
          return res.status(404).json({ ok: false, message: "Servidor não encontrado" });
        }

        if (!userCanManageGuild(req, guildId)) {
          return res.status(403).json({ ok: false, message: "Você não tem permissão" });
        }

        const TicketHandler = require("../handlers/tickets");
        if (!client.ticketHandler) {
          client.ticketHandler = new TicketHandler(client);
        }

        const panels = client.ticketHandler.getGuildPanels(guildId);
        const panelIndex = panels.findIndex(p => p.id === panelId);
        
        if (panelIndex === -1) {
          return res.status(404).json({ ok: false, message: "Painel não encontrado" });
        }

        if (channelId) {
          const targetChannel = guild.channels.cache.get(channelId);
          const isTextChannel = targetChannel && (
            targetChannel.type === 0 ||
            targetChannel.type === "GUILD_TEXT" ||
            targetChannel.type === "text" ||
            (typeof targetChannel.isTextBased === "function" && targetChannel.isTextBased())
          );
          if (!isTextChannel) {
            return res.status(400).json({ ok: false, message: "Canal de texto inválido" });
          }
        }

        const hasCategoryToggle = categoryEnabled !== undefined;
        const nextUseCategory = hasCategoryToggle ? Boolean(categoryEnabled) : Boolean(panels[panelIndex].useCategory);

        let updatedCategoryId = panels[panelIndex].categoryId;
        if (!nextUseCategory) {
          updatedCategoryId = null;
        } else if (categoryId !== undefined) {
          if (categoryId === null || categoryId === "") {
            updatedCategoryId = null;
          } else {
            const category = guild.channels.cache.get(categoryId);
            const isCategory = category && (
              category.type === 4 ||
              category.type === "GUILD_CATEGORY" ||
              category.type === "category"
            );
            if (!isCategory) {
              return res.status(400).json({ ok: false, message: "Categoria inválida" });
            }
            updatedCategoryId = categoryId;
          }
        }

        let updatedLogs = panels[panelIndex].logs;
        if (logs !== undefined) {
          const resolvedPanelLogs = await resolveValidatedPanelLogs(guild, logs);
          if (!resolvedPanelLogs.ok) {
            return res.status(400).json({ ok: false, message: resolvedPanelLogs.message });
          }
          updatedLogs = resolvedPanelLogs.value;
        }

        panels[panelIndex] = {
          ...panels[panelIndex],
          channelId: channelId || panels[panelIndex].channelId,
          useCategory: nextUseCategory,
          categoryId: updatedCategoryId,
          logs: updatedLogs,
          embeds: embeds || panels[panelIndex].embeds,
          buttons: buttons || panels[panelIndex].buttons,
          questions: questions || panels[panelIndex].questions,
          updatedAt: Date.now()
        };

        // Usar a função updatePanel do handler para consistência
        await client.ticketHandler.updatePanel(guildId, panelId, {
          channelId: channelId || panels[panelIndex].channelId,
          useCategory: nextUseCategory,
          categoryId: updatedCategoryId,
          logs: updatedLogs,
          embeds: embeds || panels[panelIndex].embeds,
          buttons: buttons || panels[panelIndex].buttons,
          questions: questions || panels[panelIndex].questions
        });

        return res.json({ ok: true, message: "Painel atualizado com sucesso" });
      } catch (err) {
        console.error("[Update Panel] Erro:", err);
        return res.status(500).json({ ok: false, message: "Erro ao atualizar painel: " + err.message });
      }
    });

    // ===============================
    // AUTOMOD ROUTES
    // ===============================
    app.get("/dashboard/:guildID/automod", checkAuth, async (req, res) => {
      const guild = client.guilds.cache.get(req.params.guildID);
      if (!guild) return res.redirect("/dashboard?error=" + encodeURIComponent("Servidor não encontrado"));
      
      let member = guild.members.cache.get(req.user.id);
      if (!member) {
        try { member = await guild.members.fetch(req.user.id); } 
        catch (err) { console.error(err); }
      }
      if (!member) return res.redirect("/dashboard?error=" + encodeURIComponent("Não foi possível obter seus dados"));
      if (!member.permissions.has("MANAGE_GUILD")) {
        return res.redirect("/dashboard?error=" + encodeURIComponent("Você não tem permissão para isso"));
      }

      const settings = client.settings.get(guild.id);

      res.render("automod", {
        req, user: req.isAuthenticated() ? req.user : null, guild, bot: getBotData(client),
        Permissions, websiteInfo: websiteInfo, callback: resolveCallbackForRequest(req),
        categories: client.categories, commands: client.commands,
        BotConfig, BotFilters, SPOTIFY_MIXES, YT_MIXES, BotEmojis,
        settings
      });
    });

    app.post("/dashboard/:guildID/automod", checkAuth, async (req, res) => {
      const guild = client.guilds.cache.get(req.params.guildID);
      if (!guild) return res.redirect("/dashboard?error=" + encodeURIComponent("Servidor não encontrado"));
      
      let member = guild.members.cache.get(req.user.id);
      if (!member) {
        try { member = await guild.members.fetch(req.user.id); } 
        catch (err) { console.error(err); }
      }
      if (!member) return res.redirect("/dashboard?error=" + encodeURIComponent("Não foi possível obter seus dados"));
      if (!member.permissions.has("MANAGE_GUILD")) {
        return res.redirect("/dashboard?error=" + encodeURIComponent("Você não tem permissão para isso"));
      }

      const {
        automodEnabled, automodLogType, automodLogChannelId, automodLogWebhook,
        automodLogMessage,
        automodMuteRole,
        automodPenalty1, automodPenalty2, automodPenalty3,
        automodBypassRoles,
        automodAntiSpamEnabled, automodAntiSpamMaxMessages, automodAntiSpamMaxSeconds,
        automodAntiLinksEnabled,
        automodAntiInviteEnabled,
        automodAntiWordsEnabled, automodAntiWordsList,
        automodAntiWordsWarnMessage,
        automodAntiNewAccountsEnabled, automodAntiNewAccountsMinDays
      } = req.body;

      client.settings.set(guild.id, !!automodEnabled, "automodEnabled");
      client.settings.set(guild.id, automodLogType === 'webhook' ? 'webhook' : 'channel', "automodLogType");
      client.settings.set(guild.id, automodLogChannelId || null, "automodLogChannelId");
      client.settings.set(guild.id, automodLogWebhook || null, "automodLogWebhook");
      client.settings.set(guild.id, automodLogMessage || '{user} | {type} | {reason}', "automodLogMessage");

      const bypassRoles = Array.isArray(automodBypassRoles) ? automodBypassRoles : automodBypassRoles ? [automodBypassRoles] : [];
      client.settings.set(guild.id, bypassRoles, "automodBypassRoles");

      client.settings.set(guild.id, automodMuteRole || null, "automodMuteRole");
      client.settings.set(guild.id, automodPenalty1 || "none", "automodPenalty1");
      client.settings.set(guild.id, automodPenalty2 || "mute", "automodPenalty2");
      client.settings.set(guild.id, automodPenalty3 || "kick", "automodPenalty3");

      client.settings.set(guild.id, !!automodAntiSpamEnabled, "automodAntiSpamEnabled");
      client.settings.set(guild.id, parseInt(automodAntiSpamMaxMessages) || 5, "automodAntiSpamMaxMessages");
      client.settings.set(guild.id, parseInt(automodAntiSpamMaxSeconds) || 3, "automodAntiSpamMaxSeconds");

      client.settings.set(guild.id, !!automodAntiLinksEnabled, "automodAntiLinksEnabled");

      client.settings.set(guild.id, !!automodAntiInviteEnabled, "automodAntiInviteEnabled");

      client.settings.set(guild.id, !!automodAntiWordsEnabled, "automodAntiWordsEnabled");
      
      client.settings.set(guild.id, automodAntiWordsWarnMessage || "Você usou palavras proibidas neste servidor.", "automodAntiWordsWarnMessage");
      
      let wordsList = [];
      if (automodAntiWordsList) {
          if (Array.isArray(automodAntiWordsList)) {
              wordsList = automodAntiWordsList.map(w => String(w).trim()).filter(w => w);
          } else if (typeof automodAntiWordsList === 'string') {
              wordsList = automodAntiWordsList.split(',').map(w => w.trim()).filter(w => w);
          }
      }
      client.settings.set(guild.id, wordsList, "automodAntiWordsList");

      client.settings.set(guild.id, !!automodAntiNewAccountsEnabled, "automodAntiNewAccountsEnabled");
      client.settings.set(guild.id, parseInt(automodAntiNewAccountsMinDays) || 1, "automodAntiNewAccountsMinDays");

      res.redirect("/dashboard/" + guild.id + "/automod?success=" + encodeURIComponent("Configurações do Auto-Mod salvas com sucesso!"));
    });

    /**
     * @START THE WEBSITE
     */
    //START THE WEBSITE ON THE DEFAULT PORT (80)
    const http = require(`http`).createServer(app);
    http.listen(httpPort, () => {
        console.log(`[${websiteInfo.domain}]: HTTP-Website running on ${httpPort} port.`)
        console.log(`[dashboard] OAuth callback: ${resolvedCallback}`)
    });
}
