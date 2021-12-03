module.exports = client => {
   process.on('unhandledRejection', (reason, p) => {
        console.log(' [antiCrash] :: Rejeição não tratada/Catch');
        console.log(reason, p);
    });
    process.on("uncaughtException", (err, origin) => {
        console.log(' [antiCrash] :: Exceção não capturada/Catch');
        console.log(err, origin);
    }) 
    process.on('uncaughtExceptionMonitor', (err, origin) => {
        console.log(' [antiCrash] :: Exceção não capturada/Catch (MONITOR)');
        console.log(err, origin);
    });
    process.on('multipleResolves', (type, promise, reason) => {
        console.log(' [antiCrash] :: Múltiplas Resoluções');
        console.log(type, promise, reason);
    });
}
