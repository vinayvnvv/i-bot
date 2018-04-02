     function voiceConfig(){
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if(SpeechRecognition){
            const recognition = new SpeechRecognition();
            recognition.lang = 'en-US';
            recognition.interimResults = false;
            recognition.maxAlternatives = 1;
            return recognition;
        }
    }
    
    function menuHandler(key){
        // console.log("KEYYYY", key);
        hideMenu();

        var data = {
            trackorder: ["Track My Order", { action: "trackorder"}],
            cancelorder: ["Cancel My Order", { action: "cancelorder" }],
            reorder: ["Re Order", { action: "reorder" }],
            recommend: ["Recommended", { action: "recommend" }],
            promotion: ["Promotions", { action: "promotion" }],
            techSupport: ["Product Support", {action: "support"}],
            csrConsole: ["CSR Console", {action: "agentai"}],
            viewcart: ["View Cart", {action: "viewcart"}],
            deletecart: ["Delete Cart", {action: "deletecart"}],
            login: ["Login", {action: "userlogin"}],
            startOver: ["Start Over", {action: "sample_get_started_payload"}]
        };
        messenger.postbackHandler({title: data[key][0], payload: JSON.stringify(data[key][1])});
    }

    // var assetsURL = "https://agridoc.herokuapp.com";
    var assetsURL = "https://instantaicore.herokuapp.com";
    // var assetsURL = "http://localhost:8888";

    var noOfMessageReceived = 0;
    var messenger = {
        config: {
            // ws_url: 'ws://fergusoncore.mybluemix.net'
            ws_url: 'wss://Instantaicore.herokuapp.com/' // CHANGE THIS TO YOUR HOST/PORT COMBO            
            // ws_url: 'ws://localhost:3000' // CHANGE THIS TO YOUR HOST/PORT COMBO            
        },
        options: {
            sound: true,
            voice: false,
            active: false
        },
        synthVoice: function(text) {
            const synth = window.speechSynthesis;
            const utterance = new SpeechSynthesisUtterance();
            utterance.text = text;
            synth.speak(utterance);
        },
        guid: null,
        on: function(event, handler) {
            this.message_window.addEventListener(event, function(evt) {
                handler(evt.detail);
            });
        },
        trigger: function(event, details) {
            var event = new CustomEvent(event, {detail: details});
            this.message_window.dispatchEvent(event);
        },
        send: function(payload, e) {
            if (e) e.preventDefault();

            console.log(payload, "TEXT");
            var message = {type: 'outgoing', text: (typeof payload === "object" ? payload.text : text) };
            this.clearReplies();
            
            if(this.next_line){
                $(this.next_line).html(renderMessage(message));       
                this.message_list.appendChild(this.next_line);
            } else {
                var el = document.createElement('div');
                $(el).html(renderMessage(message));       
                this.message_list.appendChild(el);
            }

            // $("div.message.new").goTo();    
            // scrollChatWindow();
            refreshScroll();                  

            var date = new Date();
            var currentTimestamp = date.getTime();

            payload.user = this.guid;
            payload.channel = "socket";
            payload.timestamp = currentTimestamp;
            if(payload.type === "postback"){
                payload.text = payload.payload;
            }
            this.socket.send(JSON.stringify(payload));
            this.input.value = '';

            this.trigger('sent', message);
            // console.log("MESSAAGE OBJ ON SEND", {
            //     type: 'message',
            //     text: text,
            //     user: this.guid,
            //     channel: 'socket',
            // });
            return false;
        },
        sendImage: function(payload){
            var date = new Date();
            var currentTimestamp = date.getTime();

            payload.user = this.guid;
            payload.channel = "socket";
            payload.timestamp = currentTimestamp;

            this.socket.send(JSON.stringify(payload));
        },
        connect: function(ws_url) {
            var that = this;
            // Create WebSocket connection.
            that.socket = new WebSocket(ws_url);


            // Connection opened
            that.socket.addEventListener('open', function (event) {
                console.log('CONNECTED TO SOCKET GUID', that.guid);
                that.trigger('connected', event);
                that.socket.send(JSON.stringify({
                    type: 'hello',
                    user: that.guid,
                    channel: 'socket',
                }));
            });

            that.socket.addEventListener('error', function (event) {
                console.log('ERROR', event);
            });

            that.socket.addEventListener('close', function (event) {
                console.log('SOCKET CLOSED!');
                that.trigger('disconnected', event);
                setTimeout(function() {
                    console.log('RECONNECTING');
                    that.connect(that.config.ws_url);
                }, 3000);
            });

            // Listen for messages
            that.socket.addEventListener('message', function (event) {
                // console.log('Message from server', event.data);
                var message = JSON.parse(event.data);

                if (message.typing) {
                    console.log("TYPING", message.typing);
                    that.trigger('typing', message);
                } else if (message.type == 'hello') {
                    that.guid = message.user;
                    setCookie('guid', message.user,1);
                } else {
                    that.trigger('received', message);
                    if(!that.options.active){
                        var noOfmessage = 5;
                        $("#addClass badge").text(noOfmessage);
                    }
                }
            });
        },
        clearReplies: function() {
            $('.quick-rep-wrapper').fadeOut();
            $('.quick-rep-wrapper').removeClass('active');
                if ($(window).width() <= 667) {
                // $('.chat-wrapper').animate({bottom:0},300);
                $('.web-chat-content').animate({"top":0},300);                
             }
             else {
                // $('.web-chat-content').animate({"max-height":400},300);
                $('.web-chat-content').animate({"top":0},300);
             }


             console.log("REPLIES", this.replies);
            this.replies.innerHTML = '';
            $(this.replies).removeClass("slick-initialized");
        },
        quickReply: function(reply) {
            // var payload = {
            //     text: reply.title,
            //     quick_reply: { payload: reply.payload }
            // };
            console.log("INSIDE REPLY", reply);
            var message = {
                type: "message",
                text: reply.title,
                quick_reply: { payload: reply.payload }
            };
            this.send(message);
        },
        postbackHandler: function(data){
            // console.log("BUTTON CLICKED AND THIS IS THE DATA", payload);
            var message = {
                type: "postback",
                text: data.title,
                payload: data.payload
            };
            this.send(message);
        },
        urlHandler: function(url){
            window.open(url,'_blank');
        },
        focus: function() {
            // this.input.focus();
        },
        boot: function() {

            console.log('Booting up');

            var that = this;

            if (getCookie('guid')) {
                that.guid = getCookie('guid');
            }

            that.message_window = document.getElementById("lc_chat_layout");

            that.message_list = document.getElementById("lc_chat_message_window");

            // var source   = document.getElementById('message_template').innerHTML;
            // that.message_template = Handlebars.compile(source);

            that.replies = document.getElementById('message_replies');

            that.input = document.getElementById('lc_chat_input_container');
            //Setting voice
            that.recognition = voiceConfig();
            if(that.recognition){
                that.recognition.addEventListener("result", function(event) {
                    console.log('Result has been detected.');
                    let last = event.results.length - 1;
                    let text = event.results[last][0].transcript;
            
                    console.log('Confidence: ' + JSON.stringify(this));
                    var message = {
                        type: "message",
                        text: text
                    };
                    that.send(message);

                    // $("#recordIcon")
                    //     .removeClass("fa-dot-circle-o recording")
                    //     .addClass("fa-microphone");
                    $(".record-animation").fadeOut();
                    $("#voiceTrigger").removeClass('is-recording');
                });

                that.recognition.onspeechend  = function() {
                    // $("#recordIcon")
                    //     .removeClass("fa-dot-circle-o recording")
                    //     .addClass("fa-microphone");
                    $(".record-animation").fadeOut();
                    $("#voiceTrigger").removeClass('is-recording');
                }
                
                that.recognition.onend = function() {
                    $(".record-animation").fadeOut();
                    $("#voiceTrigger").removeClass('is-recording');
                }                
                that.recognition.onerror = function() {
                    $(".record-animation").fadeOut();
                    $("#voiceTrigger").removeClass('is-recording');
                }

            }

            that.connect(that.config.ws_url);
            that.focus();

            that.on('connected', function() {
                that.message_window.className = 'connected';
                that.input.disabled = false;
            })

            that.on('disconnected', function() {
                that.message_window.className = 'disconnected';
                that.input.disabled = true;
            });

            that.on('typing', function() {
                that.clearReplies();
                if (!that.next_line) {
                    that.next_line = document.createElement('div');
                    // that.next_line.innerHTML = that.message_template({message: {typing:true}});
                    $(that.next_line).html(renderMessage({typing:true}));                    
                    that.message_list.appendChild(that.next_line);
                    refreshScroll();
                }
            });

            that.on('sent', function() {
                if (that.options.sound) {
                    var audio = new Audio(assetsURL + '/sent.mp3'); 
                    audio.play();
                }
            });

            that.on('received', function() {
                if (that.options.sound) {
                    var audio = new Audio(assetsURL + '/beep.mp3');
                    audio.play();
                }
            });

            that.on('received', function(message) {
                if(!that.options.active){
                    noOfMessageReceived += 1;
                    $("#addClass .badge").text(noOfMessageReceived).removeClass("hide");
                }else{
                    noOfMessageReceived = 0;                    
                    $("#addClass .badge").text(noOfMessageReceived).addClass("hide");                    
                }
                console.log(message);
                if(message.text){
                    if(that.options.voice){
                        that.synthVoice(message.text);
                    }
                    message.type = "incoming";
                    if (!that.next_line) {
                        that.next_line = document.createElement('div');
                        that.message_list.appendChild(that.next_line);
                    }
                    // that.next_line.innerHTML = that.message_template({message: message});
                    $(that.next_line).html(renderMessage(message));        
                    // $("div.message.new").goTo();   
                    // scrollChatWindow();
                    refreshScroll();               

                    delete that.next_line;
                }
            });

            that.on('received', function(message) {
                that.clearReplies();
                if (message.quick_replies) {
                    // hard code
                    var arr = [{title: "upload", "content-type": "text", payload: "upload"}, {title: "upload", "content-type": "text", payload: "upload"}, {title: "upload", "content-type": "text", payload: "upload"}, {title: "upload", "content-type": "text", payload: "upload"}];
                    message.quick_replies = message.quick_replies.concat(arr)
                    // hard code
                    for (var r = 0; r < message.quick_replies.length; r++) {             
                        (function(reply) {
                            console.log("INSIDE NAMESPACE REPLY", reply);
                                var li = document.createElement("li");
                                var button = document.createElement("button");           
                                $(button)
                                    .addClass("_btn")
                                    .html(reply.title);
                                button.onclick= function() {
                                    console.log("INSIDE $$$$");
                                    that.quickReply(reply);
                                };  
                                $(li).append(button);
                                $(li).addClass("quick-btn-li");
                                that.replies.appendChild(li);
                            })(message.quick_replies[r]);
                        }
                        var quickWrapperWidth = $("div.quick-rep-wrapper").outerWidth();
                        var quickReplyListWidth = 0;
                        setTimeout(function(){
                            var btnLists = $(that.replies).find("li.quick-btn-li");
                            console.log(btnLists, "LISTS");
                            btnLists.each(function(index, item){
                                console.log("WIDTH ITEM", item);
                                quickReplyListWidth += (item.offsetWidth + 10);
                            });
                            console.log("MESSAGE WRAPPER WIDTH", quickWrapperWidth);
                            console.log("BUTTONS TOTAL WIDTH", quickReplyListWidth);
                            if(quickWrapperWidth < (quickReplyListWidth + 20)){
                                makeQuickReplyTrack();
                            }else {
                                makeQuickReplyTrack();
                                console.log("ON ELSE", quickWrapperWidth, "|||", quickReplyListWidth);
                            }
                        },0);
                        // $('.web-chat-content').animate({"max-height": 365},200);
                        $('.web-chat-content').animate({"top":-35},200);
                        $('.quick-rep-wrapper').fadeIn();
                        $('.quick-rep-wrapper').addClass('active');
                        refreshScroll();
                        // $(that.replies).goTo();
                        // scrollChatWindow(); 
                }
            });
            that.on('received', function(message) {
                if (message.attachment) {
                    if(message.attachment.payload.template_type === "generic"){
                        var elements = message.attachment.payload.elements;
                        var carouselWrapper = document.createElement('div');
                        $(carouselWrapper).addClass("product-carousel");
                        for (var r = 0; r < elements.length; r++) {
                            (function(element) {
                                $(carouselWrapper).append(makeProductCard(element));
                                // console.log("CARD WRAPPER", element);
                                
                            })(elements[r]);
                            
                        }
                        if(!that.next_line){
                            that.message_list.appendChild(carouselWrapper);
                        } else {
                            $(that.next_line).html(carouselWrapper);
                            delete that.next_line;
                        } 
                        makeCarouselTrack();
                    }else if(message.attachment.payload.template_type === "list"){
                        if(!that.next_line){
                            that.message_list.appendChild(makeProductList(message.attachment.payload));
                        } else {
                            $(that.next_line).html(makeProductList(message.attachment.payload));
                            delete that.next_line;
                        } 
                    }
                    // scrollChatWindow(); 
                    refreshScroll();                  
                }
            });
            return that;
        }
    };

    //Make Buttons
    function makeButtons(data){
        var buttons = data || [],
            btns = [],
            createButton = function(item){
            var btn = document.createElement("button");
            $(btn)
                .addClass("_btn filled actn-btn")
                .text(item.title)
                .on("click", function(e){
                    if(item.type === "postback"){
                        messenger.postbackHandler(item);
                    }else if(item.type === "web_url"){
                        // console.log("URL", item.url);
                        messenger.urlHandler(item.url);
                    }
                }); 
            btns.push(btn);
        };
        
        buttons.forEach(createButton);
        return btns;
    }

    //Product lists
    function makeProductList(collection){
        var listWrapper = document.createElement("div");
        var lists = '<div class="toolbar">';
            lists += '<div class="_ttl">'+collection.elements[0].title+'</div>';
            lists += '<div class="_details">'+collection.elements[0].subtitle+'</div>';
            lists += '</div>';
        for(var i = 1; i <= collection.elements.length - 1; i++){
            console.log("I VALUE", i)
            lists += '<div class="_items">';       
            lists += '<div class="_body">';
            lists += '<div class="_ttl">'+collection.elements[i].title+'</div>';
            lists += '<div class="_dtls">'+collection.elements[i].subtitle+'</div>';
            lists += '</div>';
            lists += '<div class="_img">';
            lists += '<a href="#">';
            lists += '<img src="'+ collection.elements[i].image_url  +'" class="media-object img-circle" alt="Sample Image">';
            lists += '</a>';
            lists += '</div>';
            lists += '</div>';
        }

        var buttonWrapper = document.createElement("div");
        $(buttonWrapper)
            .append(makeButtons(collection.buttons))
            .addClass("_actn");

        $(listWrapper)
            .append(lists)
            .append(buttonWrapper)
            .addClass("list-wrapper cart-card");
        return listWrapper;
            
    } 
    //Make carousel
    function makeProductCard(item){
        var cardWrapper =  document.createElement("div");//'<div class="card-wrapper">';
        var card = "";
        card += '<div class="_pdct-card">';
        card += '<div class=" _img">';
        card += '<img src="'+ item.image_url +'" class="img-responsive" alt="Avatar">';
        card += '</div>';
        card += '<div class="_detail">';
        card += '<div class="_ttl">'+ item.title +'</div>';
        card += '<div class="_price">'+ item.subtitle + '</div>';
        card += '</div>';        
        card += '<div class="action-btn _actn">';
        card += '</div>';
        card += '</div>';
        card += '</div>';   
        
        $(cardWrapper)
            .addClass("card-wrapper")
            .append(card)
            .find("div.action-btn")
            .append(makeButtons(item.buttons));
        return cardWrapper;
    }
    // Slick track for carousel
    function makeCarouselTrack(){
        console.log("PRODUCT CAROUSE", $('.product-carousel'));
        $('.product-carousel').not( ".slick-initialized" ).slick({
            infinite: true,
            speed: 300,
            slidesToShow: 1,
            slidesToScroll: 1,
            // variableWidth: true,
            nextArrow: '<nav class="rep-nav rep-nav-right"><i class="fa fa-chevron-right"></i></nav>',
            prevArrow: '<nav class="rep-nav rep-nav-left"><i class="fa fa-chevron-left"></i></nav>',
            centerMode: true,
            // variableWidth: true
        });
    } 
    // Slick track for quick reply
    function makeQuickReplyTrack(){
        $('.quick-rep-carousel').slick({
            infinite: false,
            speed: 300,
            draggable: false,
            // edgeFriction: 0.20,
            // respondTo: 'min',
            slidesToShow: 1,
            // slidesToScroll: 1,
            nextArrow: '<nav class="rep-nav rep-nav-right"><i class="fa fa-chevron-right"></i></nav>',
            prevArrow: '<nav class="rep-nav rep-nav-left"><i class="fa fa-chevron-left"></i></nav>',
            centerMode: true,
            variableWidth: true
        });
    } 

    function urlify(text) {
        console.log("urlify", text);
        var urlRegex = /(https?:\/\/[^\s]+)/g;
        return text.replace(urlRegex, function(url) {
            return '<a class="popup-box-url" target="_blank" href="' + url + '">' + url + '</a>';
        })
        // or alternatively
        // return text.replace(urlRegex, '<a href="$1">$1</a>')
    }

    //Message 
    function renderMessage(message){
        // var imageUrls = [assetsURL + "/vickey.jpeg", assetsURL + "/bot.png"];
        console.log("MESSAGE", message);
        var text;
        if(message.text){
            text = urlify(message.text);
        }
        console.log('TEXT', text);
        var currentTime = getCurrentTime(); 
        $("div.message").removeClass("new");
        var messageTemplate = document.createElement("div");
        var  msgObj = $(messageTemplate);
        var msgContent = "";

        msgObj.addClass("message new");
        if(message.typing){
            msgContent += '<div class="_avtr">';
            msgContent += '<img src="svg/bot.svg"/>';
            msgContent += '</div>';
            // msgContent += '</div>'; 
            msgContent += '<div class="_body">'; 
            msgContent += '<div class="msg-outgoing"><div class="_text">'; 
            msgContent += '<div class="_typing">';
            msgContent += '<div class="bounce-y"></div>'; 
            msgContent += '<div class="bounce-y"></div>'; 
            msgContent += '<div class="bounce-y"></div>'; 
            msgContent += '</div>';
            msgContent += '</div></div>'; 
            msgContent += '</div>'; 
            msgContent += '</div>'; 
        }else{
            
            // msgContent += '<div class="media">';
            if(message.type !== "outgoing"){
                msgContent += '<div class="_avtr">';
                // msgContent += '<div class="media-img-wrapper img-circle">';
                msgContent += '<img src="svg/bot.svg"/>';
                // msgContent += '</div>';
                msgContent += '</div>';            
            }
            msgContent += '<div class="_body">';
            msgContent += '<div class="'+ (message.type !== "outgoing" ? "msg-outgoing": "msg-incoming") +'">';
            msgContent += '<div class="_text">';
            msgContent += '<div><span>'+ text +'</span><time class="pull-right _time">Today: '+ currentTime +' </time></div>';
            msgContent += '</div>';
            // msgContent += '<time class="pull-right _time">Today: '+ currentTime +' </time>';
            msgContent += '</div>';
            msgContent += '</div>';
            // msgContent += '</div>';
        }
        msgObj.html(msgContent);        
        console.log("MESSAGE TEMP", messageTemplate);
        return messageTemplate;
    }

    // Current time 
    function getCurrentTime() {
        var date = new Date();
        var hours = date.getHours();
        var minutes = date.getMinutes();
        var ampm = hours >= 12 ? 'pm' : 'am';
        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'
        minutes = minutes < 10 ? '0'+minutes : minutes;
        var strTime = hours + ':' + minutes + ' ' + ampm;
        return strTime;
    }

    //Chat widget 
    function createUI($){
        // var div = document.createElement("div"
        // var button = document.createElement("a");
        // button.textContent = "CHAT";
        // $(button).addClass("btn chat-btn").attr("id", "addClass");
        // <div class="round hollow text-center">
        //     <a href="#" id="addClass"><span class="fa fa-comments"></span></a>
        // </div>
        var launchIcon = "";
        launchIcon += '<div class="_pop-up-chat">';
        launchIcon += '<div href="#" id="addClass"><span class="_ttl">Chat with AgriDoctor</span><span class="_icn"><i class="fa fa-comments"></i></span><span class="badge hide"></span></div>';
        launchIcon += '</div>';        

        $("body").append(launchIcon);

        var wrapper = document.createElement("div");
        $(wrapper).addClass("chat-box");
        $(wrapper).attr("id", "lc_chat_layout");
        $("body").append(wrapper);

        var chatWindow = "";
        chatWindow += '<div class="col-xs-4 web-chat-wrapper chat-main" id="qnimate">';
        chatWindow += '<div class="row _bd">';

        chatWindow += '<div class="col-xs-12 web-chat-header">';
        // chatWindow += '<div class="media">';    
        // chatWindow += '<div class="media-left">';
        // chatWindow += '<div class="media-img-wrapper img-circle">';  
        // chatWindow += '<img src="img/3.jpg" class="media-object">';
        // chatWindow += '</div>'; 
        // chatWindow += '</div>'; 
        chatWindow += '<div class="_hdr-logo"><img src="svg/bot.svg"/></div>';
        chatWindow += '<div class="_hdr-l">'; 
        chatWindow += '<div class="_ttl">Agridoc Bot</div>'; 
        chatWindow += '<div class="_desc">powered by Instant-Bot</div>'; 
        chatWindow += '</div>'; 
        chatWindow += '<div class="_hdr-r">'; 
        chatWindow += '<i class="fa fa-times-circle close-chat"></i>'; 
        chatWindow += '</div>'; 
        // chatWindow += '</div>'; 
        chatWindow += '</div>'; 

        chatWindow += '<div class="col-xs-12 welcome-chat-wrapper">'; 
        // chatWindow += '<div class="media">'; 
        chatWindow += '<div class="_wel_msg">'; 
        chatWindow += '<h4 class="_ttl">Agridoc bot</h4>'; 
        chatWindow += '<p class="_desc">	We make it simple and seamless for you.</p>'; 
        chatWindow += '<p class="_actn"><button class="_btn filled" id="removeWelcome">Start Chat <i class="fa fa-angle-right bounce-x"></i></button></p>'; 
        chatWindow += '</div>'; 
        // chatWindow += '</div>'; 
        chatWindow += '</div>';
        chatWindow += '<div class="chat-body-wrapper col-xs-12 _chat-body-wrapper">';
        chatWindow += '<div class="row _bd">';
        // chatWindow += '<div class="_scrl_to_top"></div>'; 
        chatWindow += '<div class="col-xs-12 web-chat-body chat-content _web-chat-body">'; 
        chatWindow += '<div class="_scrl_to_top"><i class="fa fa-angle-down"></i></div>'
        chatWindow += '<div class="chat-wrapper web-chat-content nano">'; 
        chatWindow += '<div class="chat-wrapper-inner nano-content _chat-wrapper-inner" id="lc_chat_message_window">';  
        chatWindow += '</div>';     
        chatWindow += '</div>'; 
        chatWindow += '</div>'; 

        chatWindow += '<div class="quick-rep-wrapper">';
        chatWindow += '<ul class="quick-rep list-unstyled">';
        chatWindow += '<div class="quick-rep-carousel slick-slider" id="message_replies">';
        chatWindow += '</div></ul></div>';

        chatWindow += '<div class="col-xs-12 web-chat-footer _web-chat-footer">';
        chatWindow += '<div class="web-chat-footer-field">';

        // chatWindow += '<button type="button" class="pull-left dropup-menu" id="openMenu"><img src="svg/bars.svg" width="16px" height="16px"></img></button>';  
        // chatWindow += '<div class="dropup">';
        // chatWindow += '<ul class="dd-menu dd-main-level">';
        // chatWindow += '<li class="dd-submenu">';
        // chatWindow += '<a class="next-level" href="#"><span class="fa fa-chevron-right pull-right"></span> My Orders</a>';
        // chatWindow += '<ul class="dd-menu dd-sec-level">';
        // chatWindow += '<li><a class="prev-level" href="#"><span class="fa fa-chevron-left"></span> Back</a></li>';
        // chatWindow += '<li><a href="#" onclick="menuHandler(\''+ 'trackorder' +'\')">Track My Order</a></li>';
        // chatWindow += '<li><a href="#" onclick="menuHandler(\''+ 'cancelorder' +'\')">Cancel My Order</a></li>';
        // chatWindow += '<li><a href="#" onclick="menuHandler(\''+ 'reorder' +'\')">Re Order</a></li>';
        // chatWindow += '<li><a href="#" onclick="menuHandler(\''+ 'recommend' +'\')">Recommended</a></li>';
        // chatWindow += '<li><a href="#" onclick="menuHandler(\''+ 'promotion' +'\')">Promotions</a></li>';
        // chatWindow += '</ul></li>'
        // chatWindow += '<li class="dd-submenu">';
        // chatWindow += '<a class="next-level" href="#"><span class="fa fa-chevron-right pull-right"></span> Customer Service</a>';
        // chatWindow += '<ul class="dd-menu dd-sec-level">';
        // chatWindow += '<li><a class="prev-level" href="#"><span class="fa fa-chevron-left"></span> Back</a></li>';
        // chatWindow += '<li><a href="#" onclick="menuHandler(\''+ 'techSupport' +'\')">Tech Support</a></li>';
        // chatWindow += '<li><a href="#" onclick="menuHandler(\''+ 'csrConsole' +'\')">CSR Console</a></li>';
        // chatWindow += '</ul></li>';
        // chatWindow += '<li class="dd-submenu">';
        // chatWindow += '<a class="next-level" href="#"><span class="fa fa-chevron-right pull-right"></span> More...</a>';
        // chatWindow += '<ul class="dd-menu dd-sec-level">';
        // chatWindow += '<li><a class="prev-level" href="#"><span class="fa fa-chevron-left"></span> Back</a></li>';
        // chatWindow += '<li><a href="#" onclick="menuHandler(\''+ 'viewcart' +'\')">View Cart</a></li>';
        // chatWindow += '<li><a href="#" onclick="menuHandler(\''+ 'deletecart' +'\')">Delete Cart</a></li>';        
        // chatWindow += '<li><a href="#" onclick="menuHandler(\''+ 'login' +'\')">Login</a></li>';
        // chatWindow += '<li><a href="#" onclick="menuHandler(\''+ 'startOver' +'\')">Start Over</a></li>';
        // chatWindow += '</ul></li></ul></div>';
        
        chatWindow += '<textarea id="lc_chat_input_container" placeholder="Type a message..." rows="10" cols="40" name="message"></textarea>';
        chatWindow += '<button type="button" class="pull-right send-btn" id="sendMessage"><i class="fa fa-paper-plane"></i></button>';
         chatWindow += '<button id="voiceTrigger" class="pull-right btn-record" class="bg_none"><i  id="recordIcon" class="fa fa-microphone" aria-hidden="true"></i></button>';
        // chatWindow += '<div class="btn-footer text-center">';
        // 
        // chatWindow += '<div class="voice_chat_animation record-animation">';
        // chatWindow += '<div class="voice_recording">';
        // chatWindow += '<svg id="wave" data-name="Layer 1" viewBox="0 0 50 38.05">';
        // chatWindow += '<title>Audio Wave</title>';
        // chatWindow += '<path id="Line_1" data-name="Line 1" d="M0.91,15L0.78,15A1,1,0,0,0,0,16v6a1,1,0,1,0,2,0s0,0,0,0V16a1,1,0,0,0-1-1H0.91Z"/>';
        // chatWindow += '<path id="Line_2" data-name="Line 2" d="M6.91,9L6.78,9A1,1,0,0,0,6,10V28a1,1,0,1,0,2,0s0,0,0,0V10A1,1,0,0,0,7,9H6.91Z"/>';
        // chatWindow += '<path id="Line_3" data-name="Line 3" d="M12.91,0L12.78,0A1,1,0,0,0,12,1V37a1,1,0,1,0,2,0s0,0,0,0V1a1,1,0,0,0-1-1H12.91Z"/>';
        // chatWindow += '<path id="Line_4" data-name="Line 4" d="M18.91,10l-0.12,0A1,1,0,0,0,18,11V27a1,1,0,1,0,2,0s0,0,0,0V11a1,1,0,0,0-1-1H18.91Z"/>';
        // chatWindow += '<path id="Line_5" data-name="Line 5" d="M24.91,15l-0.12,0A1,1,0,0,0,24,16v6a1,1,0,0,0,2,0s0,0,0,0V16a1,1,0,0,0-1-1H24.91Z"/>';
        // chatWindow += '<path id="Line_6" data-name="Line 6" d="M30.91,10l-0.12,0A1,1,0,0,0,30,11V27a1,1,0,1,0,2,0s0,0,0,0V11a1,1,0,0,0-1-1H30.91Z"/>';
        // chatWindow += '<path id="Line_7" data-name="Line 7" d="M36.91,0L36.78,0A1,1,0,0,0,36,1V37a1,1,0,1,0,2,0s0,0,0,0V1a1,1,0,0,0-1-1H36.91Z"/>';
        // chatWindow += '<path id="Line_8" data-name="Line 8" d="M42.91,9L42.78,9A1,1,0,0,0,42,10V28a1,1,0,1,0,2,0s0,0,0,0V10a1,1,0,0,0-1-1H42.91Z"/>';
        // chatWindow += '<path id="Line_9" data-name="Line 9" d="M48.91,15l-0.12,0A1,1,0,0,0,48,16v6a1,1,0,1,0,2,0s0,0,0,0V16a1,1,0,0,0-1-1H48.91Z"/>';
        // chatWindow += '</div>';
        // chatWindow += '</div>';

        chatWindow += '</div>'; 
        chatWindow += '<div type="button" data-toggle="modal" class="pull-right btn_paper-clip" id="Attachment">\
                      <div class="bg-drop-atcmnt"></div>\
                      <i class="fa fa-plus"></i>\
                      <div class="_drop-menu">\
                      <button type="button" data-toggle="modal" class="pull-right btn_paper-clip" data-target="#uploadFile"><i class="fa fa-paperclip"></i></button>\
                      <button type="button" data-toggle="modal" class="pull-right btn-camera" data-target="#cameraModal"><i class="fa fa-camera" aria-hidden="true"></i></button>\
                      </div>\
                      </div>'; 
      
        
        chatWindow += '</div>';  

        chatWindow += '</div>'; 
        chatWindow += '</div>'; 
        chatWindow += '</div>'; 
        chatWindow += '</div>'; 

        // Started modal declaration
        chatWindow += '<div id="uploadFile" class="modal" role="dialog">'
        chatWindow += '<div class="modal-dialog modal-md">'
        chatWindow += '<div class="modal-content _modal">'
        // chatWindow += '<div class="modal-header">'
        // chatWindow += '<button type="button" class="close" data-dismiss="modal">&times;</button>'
        // chatWindow += '<h4 class="modal-title"></h4></div>'
        chatWindow += '<div class="modal-body">'
        chatWindow += '<form action="'+ assetsURL +'/image/upload" id="my-awesome-dropzone" class="dropzone">'
        chatWindow += '<div class="dz-message">'
        chatWindow += '<div class="drag-icon-cph"> <i class="fa fa-upload"></i> </div>'
        chatWindow += '<h3>Drop files here or click to upload.</h3>'
        chatWindow += '</div>'
        chatWindow += '</form>'
        chatWindow += '</div>'
        chatWindow += '<div class="modal-footer">'
        chatWindow += '<button type="button" class="_btn filled" data-dismiss="modal">Close</button>'
        chatWindow += '</div></div></div></div>';
        
        chatWindow += '<div id="cameraModal" class="modal" role="dialog">'
        chatWindow += '<div class="modal-dialog modal-md">'
        chatWindow += '<div class="modal-content _modal">'
        // chatWindow += '<div class="modal-header">'
        // chatWindow += '<button type="button" class="close" data-dismiss="modal">&times;</button>'
        // chatWindow += '<h4 class="modal-title"></h4></div>'
        chatWindow += '<div class="modal-body">'
        chatWindow += '<div class="app">'
        chatWindow += '<video id="camera-stream"></video>'
        chatWindow += '<img id="snap">'
        chatWindow += '<p id="error-message"></p>'
        chatWindow += '<div class="controls">'
        chatWindow += '<a href="#" id="delete-photo" title="Delete Photo" class="disabled"><i class="fa fa-trash-o"></i></a>'
        chatWindow += '<a href="#" id="take-photo" title="Take Photo"><i class="fa fa-camera"></i></a>'
        chatWindow += '<a href="#" id="download-photo" title="Save Photo" class="disabled"><i class="fa fa-upload"></i></a> '
        chatWindow += '</div>'
        chatWindow += '<canvas></canvas>'
        chatWindow += '</div>'

        chatWindow += '</div>'
        chatWindow += '<div class="modal-footer">'
        chatWindow += '<button type="button" class="_btn filled" data-dismiss="modal">Close</button>'
        chatWindow += '</div></div></div></div>';

        $("#lc_chat_layout").html(chatWindow);
        console.log('BOOTING THE SYSTEM');
        // <button id="muteVoice" class="bg_none"><i class="fa fa-microphone-slash" aria-hidden="true"></i></button>
        messenger.boot($);
        setCameraUI();
        setAttachmentDropDown();
    }

    function setAttachmentDropDown() {
        // Attachment
        $("#Attachment").click(function(e) {
            if(e.target.className!="bg-drop-atcmnt")
                $(this).toggleClass('active');
        });
        
        $(".bg-drop-atcmnt").click(function(e) {
            console.log(e)
             $("#Attachment").removeClass('active');
        });
    }

    function setScroll(){
        $(".chat-wrapper").nanoScroller({
            alwaysVisible: true,
            scroll: 'bottom'
        });

        //auto hide for scroll to bottom
        $('._scrl_to_top').click(function(){
            $(".chat-wrapper").nanoScroller({
            alwaysVisible: true,
            scroll: 'bottom'
        });
        });
        $('._scrl_to_top').hide();
        $('.nano-content').on('scroll', function() {
        if($(this).scrollTop() + 130 + $(this).innerHeight() >= ($(this)[0].scrollHeight)) {
            $('._scrl_to_top').hide();
            $('.quick-rep-wrapper').fadeIn();
        } else {
            $('._scrl_to_top').fadeIn();
            $('.quick-rep-wrapper').hide();
        }
    })
    }
    function refreshScroll(){
        $(".chat-wrapper").nanoScroller();
        $(".chat-wrapper").nanoScroller({
            alwaysVisible: true,
            scroll: 'bottom'
        });
    }
    //Hiding menu
    function hideMenu(){
        $('.dropup').hide();
        $('.dropup .dd-main-level').hide();
    } 
    //Load css
    function loadCss($){
        // console.log("INSIDE LOAD CSSS");
        var links = $("link");
        var bootstrapExist = false;
        var fontAwesomeExist = false;
        // console.log("LINK", links);
        links.each(function(index, link){
            // console.log("LINK", link);
            if(link.href.match(/bootstrap/gi)){
                bootstrapExist = true;
            }
            if(link.href.match(/font-awesome/gi)){
                fontAwesomeExist = true;
            }
        });
        // if(!bootstrapExist){
            var bootrapLink = $("<link>", { 
                rel: "stylesheet", 
                type: "text/css", 
                href: "https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css" 
                // href: assetsURL + "/vendor/bootstrap/css/bootstrap.min.css" 
                
            });
            bootrapLink.appendTo('head');
        // }
        var dropzonLink = $("<link>", { 
            rel: "stylesheet", 
            type: "text/css", 
            href: "https://cdnjs.cloudflare.com/ajax/libs/dropzone/5.2.0/min/dropzone.min.css" 
        });
        dropzonLink.appendTo('head');

        if(!fontAwesomeExist){
            var fontAwesomeLink = $("<link>", { 
                rel: "stylesheet", 
                type: "text/css", 
                href: "https://maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css" 
            });
            fontAwesomeLink.appendTo('head');
        }

        var slickLink = $("<link>", { 
            rel: "stylesheet", 
            type: "text/css", 
            href: "https://cdnjs.cloudflare.com/ajax/libs/slick-carousel/1.8.1/slick.min.css" 
        });
        slickLink.appendTo('head');
        var nanoLink = $("<link>", { 
            rel: "stylesheet", 
            type: "text/css", 
            href: assetsURL + "/css/nano-scroll.css"
        });
        nanoLink.appendTo('head'); 
        var cssLink = $("<link>", { 
            rel: "stylesheet", 
            type: "text/css", 
            href: assetsURL + "/main.css"
        });
        cssLink.appendTo('head');   
    } 

    //Load js 
    function loadJs(){
        var head =  document.getElementsByTagName("head")[0] || document.documentElement;         
        var bootstrapScript = document.createElement('script');
        bootstrapScript.setAttribute("type","text/javascript")
        bootstrapScript.setAttribute("src", "https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/js/bootstrap.min.js");
        head.insertBefore(bootstrapScript, head.childNodes[2]);
        var slickScript = document.createElement('script');
        slickScript.setAttribute("type","text/javascript")
        slickScript.setAttribute("src", assetsURL + "/slick.js");
        head.insertBefore(slickScript, head.childNodes[3]);
        var dropzonScript = document.createElement('script');
        dropzonScript.setAttribute("type","text/javascript")
        dropzonScript.setAttribute("src", "https://cdnjs.cloudflare.com/ajax/libs/dropzone/5.2.0/min/dropzone.min.js");
        head.insertBefore(dropzonScript, head.childNodes[4]);
        if (dropzonScript.readyState) {
            dropzonScript.onreadystatechange = function () { // For old versions of IE
                if (this.readyState == 'complete' || this.readyState == 'loaded') {
                   initiazeDropzon();
                }
            };
        }else{
            dropzonScript.onload = initiazeDropzon;
        } 

        var nanoScript = document.createElement('script');
        nanoScript.setAttribute("type","text/javascript")
        nanoScript.setAttribute("src", assetsURL + "/js/nano-scroll.js");
        head.insertBefore(nanoScript, head.childNodes[5]);

        if (nanoScript.readyState) {
            nanoScript.onreadystatechange = function () { // For old versions of IE
                if (this.readyState == 'complete' || this.readyState == 'loaded') {
                    setScroll();
                }
            };
        }else{
            nanoScript.onload = setScroll;
        } 

    } 
    //Checking JQUERY 
    (function() {
        
            // Localize jQuery variable
            var jQuery;
        
        /******** Load jQuery if not present *********/
        if (window.jQuery === undefined) {
            var script_tag = document.createElement('script');
            script_tag.setAttribute("type","text/javascript");
            script_tag.setAttribute("src",
                "https://code.jquery.com/jquery-3.2.1.min.js");
            if (script_tag.readyState) {
              script_tag.onreadystatechange = function () { // For old versions of IE
                  if (this.readyState == 'complete' || this.readyState == 'loaded') {
                      scriptLoadHandler();
                  }
              };
            } else {
              script_tag.onload = scriptLoadHandler;
            }
            // Try to find the head, otherwise default to the documentElement
            console.log("SCRIPT TAG", script_tag);
            console.log(document.getElementsByTagName("head"));    
            // var t = document.getElementsByTagName('script')[0]; 
            var head =  document.getElementsByTagName("head")[0] || document.documentElement;  
            // t.parentNode.insertBefore(script_tag, t);
            head.insertBefore(script_tag, head.childNodes[0]);
        } else {
            // The jQuery version on the window is the one we want to use
            jQuery = window.jQuery;
            main();
        }
        
        /******** Called once jQuery has loaded ******/
        function scriptLoadHandler() {
            // Restore $ and window.jQuery to their previous values and store the
            // new jQuery in our local jQuery variable
            jQuery = window.jQuery.noConflict(true);
            window.jQuery = jQuery;
            // Call our main function
            main(); 
        }
        
        /******** Our main function ********/
        function main() { 
            jQuery(document).ready(function($) {
                window.$ = $; 
                /******* Load CSS *******/
                // loadCss($); 
                // loadJs();
                var __init = false;
                createUI($);

                initiazeDropzon();
                setScroll();                
                // /******* Load HTML *******/
                // var jsonp_url = "http://al.smeuh.org/cgi-bin/webwidget_tutorial.py?callback=?";
                // $.getJSON(jsonp_url, function(data) {
                //   $('#example-widget-container').html("This data comes from another server: " + data.html);
                // });
      
                $("#addClass").click(function () {
                    console.log("INSIDE");
                    // $('#qnimate').addClass('popup-box-on');
                    // $('#qnimate').addClass('popup-box-on').animate({right:50},400); 
                    if ($(window).width() <= 667) {
                        $('#qnimate').addClass('popup-box-on').animate({right:19},400);
                        initSocket();
                     }
                     else {
                         $('#qnimate').addClass('popup-box-on').animate({right:45},400);

                     }
                    messenger.options.active = true;                  
                });

                function initSocket () {

                        if(!__init) {
                            __init = true;
                            messenger.socket.send(JSON.stringify({
                                type: 'message',
                                text: 'hello',
                                user: messenger.guid,
                                channel: 'socket'
                            }));   
                        } 
                        // $(".welcome-chat-wrapper").fadeOut();      
                        $(".chat-body-wrapper").fadeIn();    
                }
                  
                $(".close-chat").click(function () {
                    $('#qnimate').animate({right:-350},400);
                    setTimeout(function () {
                        $('#qnimate').removeClass('popup-box-on');
                    }, 300);
                    //   $('#qnimate').removeClass('popup-box-on');
                    messenger.options.active = false;      
                    noOfMessageReceived = 0;                    
                    $("#addClass .badge").text(noOfMessageReceived).addClass("hide");                              
                });

                $("#sendMessage").on("click", function(event){
                    console.log("INSIDE MESSAGE")
                    $("#sendMessage").addClass('hide');
                    $("#voiceTrigger").removeClass('hide');


                    var val = $("#lc_chat_input_container").val();
                    val = val.replace(/\r?\n|\r/g, "");
                    console.log("SENDING MESSAGE", val);
                    if(val !== ""){
                        messenger.options.voice = false;
                        var message = {
                            type: "message",
                            text: val
                        };
                        messenger.send(message, event);
                    }
                });

                $("#sendMessage").addClass('hide');
                $('#lc_chat_input_container').keyup(function (event) {
                    console.log('focused')
                    if(this.value.length > 0) {
                        $("#sendMessage").removeClass('hide');
                        $("#voiceTrigger").addClass('hide');
                    } else {
                        $("#sendMessage").addClass('hide');
                        $("#voiceTrigger").removeClass('hide');
                    }
                    if (event.keyCode == 13 && event.shiftKey) {
                        var content = this.value;
                        var caret = getCaret(this);
                        this.value = content.substring(0, caret) + "\n"+ content.substring(caret, content.length-1);
                        event.stopPropagation();
                   } else if(event.keyCode === 13){
                        $("#sendMessage").click();
                   }
                });
                $('#lc_chat_input_container').focus(function (event) {
                        $(".web-chat-footer-field").addClass('focused');
                });
                $('#lc_chat_input_container').blur(function (event) {
                        $(".web-chat-footer-field").removeClass('focused');
                });

                function getCaret(el) { 
                    if (el.selectionStart) { 
                        return el.selectionStart; 
                    } else if (document.selection) { 
                        el.focus(); 
                        var r = document.selection.createRange(); 
                        if (r == null) { 
                        return 0; 
                        } 
                    
                        var re = el.createTextRange(), 
                            rc = re.duplicate(); 
                        re.moveToBookmark(r.getBookmark()); 
                        rc.setEndPoint('EndToStart', re); 
                    
                        return rc.text.length; 
                    }  
                    return 0; 
                }
                //Send on enter 
                // $("#lc_chat_input_container").keypress(function(e) {
                //     if(e.which == 13) {
                //         //alert('You pressed enter!');
                        
                //     }
                // });

                $("#voiceTrigger").on("click", function(event){
                    if(messenger.recognition){
                        messenger.options.voice = true;
                        messenger.recognition.start();

                        $("#voiceTrigger").addClass('is-recording');
                        $(".record-animation").fadeIn();
                        // $("#recordIcon")
                        //     .removeClass("fa-microphone")
                        //     .addClass("fa-dot-circle-o recording");
                        // $(this).removeClass('recording');
                    } else {
                        alert("It looks like your browser doesn't support speech recognition");
                        messenger.options.voice = false;
                    }

                    // var recognition;
                    // if(!messenger.options.voiceRecgnition){
                    //     recognition = messenger.voiceConfig();
                    // }
                    // recognition.start();
                    // recognition.addEventListener("result", voiceHandler);
                });

                //Remove  welcome and send welcome message
                $(".welcome-chat-wrapper").hide();
                // $("#removeWelcome").on("click", function(event){  
                //     messenger.socket.send(JSON.stringify({
                //         type: 'message',
                //         text: 'hello',
                //         user: messenger.guid,
                //         channel: 'socket'
                //     }));    
                //     // $(".welcome-chat-wrapper").fadeOut();      
                //     $(".chat-body-wrapper").fadeIn();    
                // });

                //Dropup 
                $('.dropup .dd-menu a').click(function (e) {
                    e.preventDefault();
                });
                $('#openMenu').click(function (){
                    $('.dropup').fadeIn();
                    $('.dropup .dd-main-level').fadeIn();
                    // $('.dropup .dd-menu .fa-chevron-right').click(function () {
                    //     $(this).parents('li').children('.dd-sec-level').fadeIn().height($('.dropup .dd-main-level').height());
                
                    //     $('.dropup .dd-menu .fa-chevron-left').click(function () {
                    //         $(this).parents('.dd-sec-level').fadeOut();
                    //     })
                    // });
                    $('.dd-menu .next-level').click(function () {
                        var mainLvlHeight = $('.dd-main-level').height();
                        $(this).parents('li').children('.dd-sec-level').fadeIn().css('min-height', mainLvlHeight);
    
                        $('.dd-menu .prev-level').click(function () {
                            $(this).parents('.dd-sec-level').fadeOut();
                        });
                    });
                });
                
                // $('#cameraModal').on('show.bs.modal', function (e) {
                //     // if (!data) return e.preventDefault() // stops modal from being shown
                //     // setCameraUI();
                // });

                $(document).mouseup(function(e) 
                {
                    var container = $('.dropup');
                
                    // if the target of the click isn't the container nor a descendant of the container
                    if (!container.is(e.target) && container.has(e.target).length === 0) 
                    {
                    //    container.hide();
                    //     $('.dropup .dd-main-level').hide();
                        hideMenu();
                    }
                });
                // Scrolling
                // $.fn.goTo = function() {
                //     console.log("THIS", $(this));

                //     $(".popup-messages").animate({
                //         scrollTop: $(this).offset().top + 'px'
                //     }, 'fast');
                //     return this; // for chaining...
                // }

                console.log($("#my-awesome-dropzone"), "DROPZON");

                // $("#my-awesome-dropzone").change(function() {
                //     console.log("FILE UPLOAD FIRED");
                //     var files = $(this).get(0).files;
                
                //     if (files.length > 0){
                //         var formData = new FormData();
                
                //         // loop through all the selected files and add them to the formData object
                //         for (var i = 0; i < files.length; i++) {
                //             var file = files[i];
                //             console.log("FILE", file);
                //             // add the files to formData object for the data payload
                //             formData.append('file', file, file.name);
                //         }
                
                //         insertImage(file);

                //         fileUploadAjax(formData);
                //     }
                // });

                // $("#muteVoice").on("click", function(event){
                //     messenger.options.voice = false;
                // });
            }(jQuery));
        }
        
      })(); // We call our anonymous function immediately
      // //-- NOTE: No use time on insertChat.
      
      
    //Setting the cookies

function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    var expires = "expires="+ d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for(var i = 0; i <ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
} 


function setCameraUI(){

    var videoTrack;
    // References to all the element we will need.
    var video = document.querySelector('#camera-stream'),
    image = document.querySelector('#snap'),
    // start_camera = document.querySelector('#start-camera'),
    controls = document.querySelector('.controls'),
    take_photo_btn = document.querySelector('#take-photo'),
    delete_photo_btn = document.querySelector('#delete-photo'),
    download_photo_btn = document.querySelector('#download-photo'),
    error_message = document.querySelector('#error-message');


    // Mobile browsers cannot play video without user input,
    // so here we're using a button to start it manually.

    // // Start video playback manually.
    // video.play();
    // showVideo();


    take_photo_btn.addEventListener("click", function(e){

        e.preventDefault();

        var snap = takeSnapshot();

        // Show image. 
        image.setAttribute('src', snap);
        image.classList.add("visible");

        // Enable delete and save buttons
        delete_photo_btn.classList.remove("disabled");
        download_photo_btn.classList.remove("disabled");

        // Set the href attribute of the download button to the snap url.
        // download_photo_btn.href = snap;

        // Pause video playback of stream.
        video.pause();

    });

    $('#cameraModal').on('hidden.bs.modal', function (e) {
        if(videoTrack){
            videoTrack.stop();
            delete_photo_btn.click();
        }
    });

    $('#cameraModal').on('show.bs.modal', function (e) {
        console.log("SETTIGN UP camera modal");
        // Some browsers need a prefix so here we're covering all the options
        // The getUserMedia interface is used for handling camera input.
        navigator.getMedia = ( navigator.getUserMedia ||
            navigator.webkitGetUserMedia ||
            navigator.mozGetUserMedia ||
            navigator.msGetUserMedia);


        if(!navigator.getMedia) {
            displayErrorMessage("Your browser doesn't have support for the navigator.getUserMedia interface.");
        } else {

            // Request the camera.
            navigator.getMedia({ video: true }, function(stream){
                // Create an object URL for the video stream and
                // set it as src of our HTLM video element.
                video.src = window.URL.createObjectURL(stream);
                videoTrack = stream.getTracks()[0];
                // Play the video element to start the stream.
                video.play();
                video.onplay = function() {
                    showVideo();
                };
            }, function(err){
                displayErrorMessage("There was an error with accessing the camera stream: " + err.name, err);
            });
        }
    });

    download_photo_btn.addEventListener("click", function(e){
        e.stopPropagation();
        var url = $(image).attr("src");
        submitImage(url);
    });

    delete_photo_btn.addEventListener("click", function(e){

        e.preventDefault();

        // Hide image.
        image.setAttribute('src', "");
        image.classList.remove("visible");

        // Disable delete and save buttons
        delete_photo_btn.classList.add("disabled");
        download_photo_btn.classList.add("disabled");

        // Resume playback of stream.
        video.play();

    });



    function showVideo(){
        // Display the video stream and the controls.

        hideUI();
        video.classList.add("visible");
        controls.classList.add("visible");
    }


    function takeSnapshot(){
        // Here we're using a trick that involves a hidden canvas element.  

        var hidden_canvas = document.querySelector('canvas'),
        context = hidden_canvas.getContext('2d');

        var width = video.videoWidth,
            height = video.videoHeight;

        if (width && height) {

            // Setup a canvas with the same dimensions as the video.
            hidden_canvas.width = width;
            hidden_canvas.height = height;

            // Make a copy of the current frame in the video on the canvas.
            context.drawImage(video, 0, 0, width, height);

            // Turn the canvas image into a dataURL that can be used as a src for our photo.
            return hidden_canvas.toDataURL('image/png');
        }
    }


    function displayErrorMessage(error_msg, error){
        error = error || "";
        if(error){
        console.log(error);
        }

        error_message.innerText = error_msg;

        hideUI();
        error_message.classList.add("visible");
    }


    function hideUI(){
        // Helper function for clearing the app UI.

        controls.classList.remove("visible");
        // start_camera.classList.remove("visible");
        video.classList.remove("visible");
        // snap.classList.remove("visible");
        error_message.classList.remove("visible");
    }
}


function submitImage(url){
    // Get the form
    // var form = document.getElementById("myAwesomeForm");

    var ImageURL = url
    // Split the base64 string in data and contentType
    var block = ImageURL.split(";");
    // Get the content type
    var contentType = block[0].split(":")[1];// In this case "image/gif"
    // get the real base64 content of the file
    var realData = block[1].split(",")[1];// In this case "iVBORw0KGg...."

    // Convert to blob
    var blob = b64toBlob(realData, contentType);

    // Create a FormData and append the file
    var fd = new FormData();
    fd.append("file", blob);

    console.log("FORM DATA", fd);
    // Submit Form and upload file

    insertImage(url);

    fileUploadAjax(fd);
}

function insertImage(url){
    messenger.clearReplies();
    var el = document.createElement('div');
    // $(el).html(renderMessage(message));  
    var tmplt = "";
    tmplt += '<div class="div-blur">';
    tmplt += '<div class="div-inside-blur">';
    tmplt += '<img src="'+ url +'" class="img-responsive" alt="">';
    $(el).html(tmplt);       
    messenger.message_list.appendChild(el);

    // scrollChatWindow();
    refreshScroll();
    //Close Modal
    $('#cameraModal').modal('hide'); 
}
function b64toBlob(b64Data, contentType, sliceSize) {
    contentType = contentType || '';
    sliceSize = sliceSize || 512;

    var byteCharacters = atob(b64Data);
    var byteArrays = [];

    for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
        var slice = byteCharacters.slice(offset, offset + sliceSize);

        var byteNumbers = new Array(slice.length);
        for (var i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
        }

        var byteArray = new Uint8Array(byteNumbers);

        byteArrays.push(byteArray);
    }

  var blob = new Blob(byteArrays, {type: contentType});
  return blob;
}

function scrollChatWindow(){
    // console.log("CHAT WRAPPER INNER", $('.chat-wrapper-inner'));
    // $('.chat-wrapper-inner').scrollTop($('.chat-wrapper-inner').scrollHeight);
}

function fileUploadAjax(data){
    if(!data) return;
    $.ajax({
        url:  assetsURL + "/image/upload",
        data: data,// the formData function is available in almost all new browsers.
        type:"POST",
        contentType:false,
        processData:false,
        cache:false,
        dataType:"json", // Change this according to your response from the server.
        xhr: function () {
            var xhr = new window.XMLHttpRequest();
            //Download progress
            xhr.addEventListener("progress", function (e) {
                if(e.lengthComputable){
                    console.log("LOADED", e.loaded);
                    console.log("TOTAL", e.total);
                    var perc = Math.round((e.loaded * 100) / e.total);
                    var filterVal = (10 * (perc/100)) - 10;
                    filterVal = 'blur('+ filterVal +')';
                    console.log("filterVal", filterVal);

                    updateImgBlurr(filterVal);
                }
            }, false);
            return xhr;
        },
        error:function(err){
            console.log(err);
        },
        success:function(data){
            console.log(data, "image dtaat");
            var message = {
                type: "message",
                image: data.url,
                attachments: [{ type: 'image', payload: {url: data.url} }]
            };
            messenger.sendImage(message);
        },
        complete:function(){
            console.log("Request finished.");
        }
    });
}

function updateImgBlurr (filterVal){
    // Loading blurr or disappearing blurr on loading TBD
    filterVal = 'blur(0px)';
    $(document).find(".div-inside-blur")
        .css('filter',filterVal)
        .css('webkitFilter',filterVal)
        .css('mozFilter',filterVal)
        .css('oFilter',filterVal)
        .css('msFilter',filterVal);
}

function initiazeDropzon(e){
    Dropzone.options.myAwesomeDropzone = {
        init: function() {
            this.on("complete", function(file) {
                if(file){
                    insertImage(file.dataURL);
                }

                $("#uploadFile").modal("hide");     
                this.removeFile(file);

                var filterVal = 'blur(0px)';
                updateImgBlurr(filterVal);
            });
            this.on("success", function(data){
                console.log("IMAGE UPLOAD SUCCEESS", data);
                var message;
                if(data.xhr && data.xhr.response){
                    data = JSON.parse(data.xhr.response);
                    message = {
                        type: "message",
                        image: data.url,
                        attachments: [{ type: 'image', payload: {url: data.url} }]
                    };
                } else {
                    message = {
                        type: "message",
                        image: data.url,
                        attachments: [{ type: 'image', payload: {url: data.url} }]
                    };
                }
                messenger.sendImage(message);
            });
        }
    };
}
