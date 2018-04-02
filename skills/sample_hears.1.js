module.exports = function(controller) {


  controller.hears('tell me something','message_received', function(bot, message) {

    bot.reply(message,'You are great');

  });



}
