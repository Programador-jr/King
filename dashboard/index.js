const express = require("express");
const http = require("http");  
const url = require(`url`);
const path = require(`path`);
const { Permissions } = require("discord.js");
const ejs = require("ejs");
const fs = require("fs")
const passport = require(`passport`);
const bodyParser = require("body-parser");
const Strategy = require(`passport-discord`).Strategy;
const BotConfig = require("../botconfig/config.json");
const BotFilters = require("../botconfig/filters.json");
const BotEmojis = require("../botconfig/emojis.json");
const BotEmbed = require("../botconfig/embed.json");
const { getSongSearchData, getLyricsWithFallback } = require("../handlers/lyricsService");

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
    const dashboardDomain = process.env.DASHBOARD_DOMAIN || settings?.website?.domain || "";
    const dashboardCallback = process.env.DASHBOARD_CALLBACK || settings?.config?.callback || "";
    const dashboardSessionSecret = process.env.DASHBOARD_SESSION_SECRET || `#@%#&^$^$%@$^$&%#$%@#$%$^%&$%^#$%@#$%#E%#%@$FEErfgr3g#%GT%536c53cc6%5%tv%4y4hrgrggrgrgf4n`;

    if (!dashboardClientId || !dashboardClientSecret) {
      console.log("[dashboard] Desativado: DASHBOARD_CLIENT_ID/DASHBOARD_CLIENT_SECRET ausentes no .env (ou dashboard/settings.json).");
      return;
    }

    const httpPort = Number(settings?.config?.http?.port) || 5000;
    const defaultLocalDomain = `http://localhost:${httpPort}`;
    const normalizeBaseUrl = (value) => String(value || "").trim().replace(/\/+$/, "");
    const isPlaceholderUrl = (value) => {
      const normalized = normalizeBaseUrl(value).toLowerCase();
      return !normalized || normalized.includes("your-domain.com");
    };

    const resolvedDomain = isPlaceholderUrl(dashboardDomain)
      ? defaultLocalDomain
      : normalizeBaseUrl(dashboardDomain);

    const resolvedCallback = isPlaceholderUrl(dashboardCallback)
      ? `${resolvedDomain}/callback`
      : String(dashboardCallback).trim();
    const isLocalCallback = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/i.test(resolvedCallback);

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
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({
      extended: true
    }));
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
        return passport.authenticate(`discord`, {
          failureRedirect: "/",
          callbackURL
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
            res.redirect(backURL);
        }
    });



    //When the website is loaded on the main page, render the main page + with those variables
    app.get("/", (req, res) => {
        res.render("index", {
          req: req,
          user: req.isAuthenticated() ? req.user : null,
          //guild: client.guilds.cache.get(req.params.guildID),
          botClient: client,
          Permissions: Permissions,
          bot: websiteInfo,
          callback: resolveCallbackForRequest(req),
          categories: client.categories, 
          commands: client.commands, 
          BotConfig: BotConfig,
          BotFilters: BotFilters,
          BotEmojis: BotEmojis,
        });
    })


    // When the commands page is loaded, render it with those settings
    app.get("/commands", (req, res) => {
      res.render("commands", {
        req: req,
        user: req.isAuthenticated() ? req.user : null,
        //guild: client.guilds.cache.get(req.params.guildID),
        botClient: client,
        Permissions: Permissions,
        bot: websiteInfo,
        callback: resolveCallbackForRequest(req),
        categories: client.categories, 
        commands: client.commands, 
        BotConfig: BotConfig,
        BotFilters: BotFilters,
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
          botClient: client,
          Permissions: Permissions,
          bot: websiteInfo,
          callback: resolveCallbackForRequest(req),
          categories: client.categories, 
          commands: client.commands, 
          BotConfig: BotConfig,
          BotFilters: BotFilters,
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
        defaultfilters: [`bassboost6`, `clear`],
        djroles: [],
        botchannel: []
      })


      // We render template using the absolute path of the template and the merged default data with the additional data provided.
      res.render("settings", {
          req: req,
          user: req.isAuthenticated() ? req.user : null,
          guild: client.guilds.cache.get(req.params.guildID),
          botClient: client,
          Permissions: Permissions,
          bot: websiteInfo,
          callback: resolveCallbackForRequest(req),
          categories: client.categories, 
          commands: client.commands, 
          BotConfig: BotConfig,
          BotFilters: BotFilters,
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
      if(req.body.prefix) client.settings.set(guild.id, String(req.body.prefix).split(" ")[0], "prefix")
      if(req.body.defaultvolume) client.settings.set(guild.id, Number(req.body.defaultvolume), "defaultvolume")
      //if autoplay is enabled set it to true
      if(req.body.defaultautoplay) client.settings.set(guild.id, true, "defaultautoplay")
      //otherwise not
      else client.settings.set(guild.id, false, "defaultautoplay")
      
      //if there are new defaultfilters, set them
      if(req.body.defaultfilters) client.settings.set(guild.id, req.body.defaultfilters, "defaultfilters")
      if(req.body.djroles) client.settings.set(guild.id, req.body.djroles, "djroles")
      if(req.body.botchannel) client.settings.set(guild.id, req.body.botchannel, "botchannel")
      // We render template using the absolute path of the template and the merged default data with the additional data provided.
      res.render("settings", {
          req: req,
          user: req.isAuthenticated() ? req.user : null,
          guild: client.guilds.cache.get(req.params.guildID),
          botClient: client,
          
          Permissions: Permissions,
          bot: websiteInfo,
          callback: resolveCallbackForRequest(req),
          categories: client.categories, 
          commands: client.commands, 
          BotConfig: BotConfig,
          BotFilters: BotFilters,
          BotEmojis: BotEmojis,
        }
      );
    });



    // Queue Dash
    app.get("/queue/:guildID", async (req,res) => {
      res.render("queue", {
        req: req,
        user: req.isAuthenticated() ? req.user : null,
        guild: client.guilds.cache.get(req.params.guildID),
        botClient: client,
        Permissions: Permissions,
        bot: websiteInfo,
        callback: resolveCallbackForRequest(req),
        categories: client.categories, 
        commands: client.commands, 
        BotConfig: BotConfig,
        BotFilters: BotFilters,
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
        botClient: client,
        Permissions: Permissions,
        bot: websiteInfo,
        callback: resolveCallbackForRequest(req),
        categories: client.categories, 
        commands: client.commands, 
        BotConfig: BotConfig,
        BotFilters: BotFilters,
        BotEmojis: BotEmojis,
      });
    })

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
