module.exports = {
    name: "slowmode",
		category: "moderação",
		usage: "slowmode <tempo>",
		aliases:["slow", "modolento"],
    description: "Permite definir o modo lento no canal",
    run: (client, message, args) => {
        const amount = parseInt(args[0])
        if(message.member.hasPermission("MANAGE_CHANNEL"))
        if(isNaN(amount)) return message.channel.send("Não parece ser um número válido")
        if(args[0] === amount + "s") {
        message.channel.setRateLimitPerUser(amount)
        if(amount > 1) {
        message.channel.send("slowmode definido para " + amount + " segundos")
        return
        }
        else {message.channel.send("slowmode definido para " + amount + " segundos")
        return }
    } if(args[0] === amount + "min") {
        message.channel.setRateLimitPerUser(amount * 60)
        if(amount > 1) {
        message.channel.send("slowmode definido para " + amount + " minutos")
        return
        } else { 
            message.channel.send("slowmode definido para " + amount + " minuto(s)")   
             
    
    return }
    } if(args[0] === amount + "h") {
        message.channel.setRateLimitPerUser(amount * 60 * 60)
        if(amount > 1) {
        message.channel.send("slowmode definido para " + amount + " hora(s)")
        return
        } else {
            message.channel.send("slowmode definido para " + amount + " hora(s)")
        return}
    } else {
        message.channel.send("Você só pode definir segundos(s), minutos(min) e horas(h)")
    }

    }
}
