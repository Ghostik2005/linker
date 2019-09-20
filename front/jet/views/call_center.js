"use strict";

import {JetView} from "webix-jet";
import {setButtons,request, checkVal} from "../views/globals";



export default class caller extends JetView{
    config(){
        var vi = this;
        let app = this.app;
        
        var dsp = {height: 40,
            view: "toolbar",
            css: "side_tool_bar",
            cols: [
                {view: "text", value: "",
                    css: 'info',
                    pattern: webix.patterns.phone,
                    localId: "_dsp"
                },
                {view: "button", 
                    type: 'htmlbutton',
                    label: "<span class='address_book_icon webix_icon fa-address-book'></span>",
                    width: 30,
                },
            ]
        }

        var info = {
            view: "toolbar",
            css: "side_tool_bar",
            cols: [
                {//height: 40,
                    css: 'info',
                    view: "text", value: "",
                    disabled: true,
                    placeholder: "inbound call info"
                }
            ]
        }

        var keyboard = {
            view: "toolbar",
            css: "side_tool_bar",
            borderless: true,
            width: 200,
            rows: [
                {cols: [
                    {view: "button", 
                        type: "htmlbutton",
                        name: "1",
                        label: "<span class='address_book_icon'>1</span>",
                        on: {
                            onItemClick: function() {
                                this.$scope.tape(this);
                            }
                        },
                    },
                    {view: "button", 
                        type: "htmlbutton",
                        name: "2",
                        label: "<span class='address_book_icon'>2</span>",
                        on: {
                            onItemClick: function() {
                                this.$scope.tape(this);
                            }
                        },
                    },
                    {view: "button",  
                        type: "htmlbutton",
                        name: "3",
                        label: "<span class='address_book_icon'>3</span>",
                        on: {
                            onItemClick: function() {
                                this.$scope.tape(this);
                            }
                        },
                    },
                ]
                },
                {cols: [
                    {view: "button",  
                        type: "htmlbutton",
                        name: "4",
                        label: "<span class='address_book_icon'>4</span>",
                        on: {
                            onItemClick: function() {
                                this.$scope.tape(this);
                            }
                        },
                    },
                    {view: "button",  
                        type: "htmlbutton",
                        name: "5",
                        label: "<span class='address_book_icon'>5</span>",
                        on: {
                            onItemClick: function() {
                                this.$scope.tape(this);
                            }
                        },
                    },
                    {view: "button",  
                        type: "htmlbutton",
                        name: "6",
                        label: "<span class='address_book_icon'>6</span>",
                        on: {
                            onItemClick: function() {
                                this.$scope.tape(this);
                            }
                        },
                    },
                ]
                },
                {cols: [
                    {view: "button",  
                        type: "htmlbutton",
                        name: "7",
                        label: "<span class='address_book_icon'>7</span>",
                        on: {
                            onItemClick: function() {
                                this.$scope.tape(this);
                            }
                        },
                    },
                    {view: "button",  
                        type: "htmlbutton",
                        name: "8",
                        label: "<span class='address_book_icon'>8</span>",
                        on: {
                            onItemClick: function() {
                                this.$scope.tape(this);
                            }
                        },
                    },
                    {view: "button",  
                        type: "htmlbutton",
                        name: "9",
                        label: "<span class='address_book_icon'>9</span>",
                        on: {
                            onItemClick: function() {
                                this.$scope.tape(this);
                            }
                        },
                    },
                ]
                },
                {cols: [
                    {view: "button", value: '#',
                        on: {
                            onItemClick: () => {
                                this.$$("_dsp").focus();
                            },
                        },
                    },
                    {view: "button",
                        type: "htmlbutton",
                        name: "0",
                        label: "<span class='address_book_icon'>0</span>",
                        on: {
                            onItemClick: function() {
                                this.$scope.tape(this);
                            }
                        },
                    },
                    {view: "button",  
                        type: "htmlbutton",
                        label: "<span class='address_book_icon'><=</span>",
                        on: {
                            onItemClick: () => {
                                let val = this.$$("_dsp").getValue();
                                if (val.length > 0) {
                                    this.$$("_dsp").setValue(val.slice(0, -1));
                                    this.$$("_dsp").focus();
                                } 
                            }
                        },
                    },
                ]
                },
            ]
        }

        var buttons = {
            view: "toolbar",
            css: "side_tool_bar",
            height: 30,
            cols: [
                {view: "button", 
                    type: "htmlbutton",
                    label: "<span class='address_book_icon'>reset</span>",
                    on:{
                        onItemClick: () => {
                            this.hangUp();
                            // this.$$("_dsp").setValue('');
                            this.$$("_dsp").focus();
                        }
                    }
                },
                {view: "button",
                    type: "htmlbutton",
                    label: "<span class='address_book_icon webix_icon fa-phone'></span>",
                    on:{
                        onItemClick: () => {
                            this.call();
                            this.$$("_dsp").focus();
                        },
                    },
                },
            ]
        }


        var _view = {
            view: "layout",
            rows: [
                dsp,
                keyboard,
                buttons,
                info
                ]}

        let pop_window = {view: "cWindow",
            autoheight: true,
            modal: !true,
            on: {
                },
            body: _view
        }

        return pop_window
        }

    tape(view){
        let value = view.config.name;
        this.$$("_dsp").setValue(this.$$("_dsp").getValue() + value);
        this.$$("_dsp").focus();
    }

    show_w(new_head){
        this.getRoot().getHead().getChildViews()[0].setValue(new_head);
        this.getRoot().show();
        this.$$("_dsp").focus();
    }


    hide_w(){
        this.getRoot().hide()
    }

    isVisible() {
        return this.getRoot().isVisible()
    }

    call() {
        console.log('call');

        let number = this.$$("_dsp");
        localStorage.setItem("callNumber", number);
    
        this.callButton.addClass('d-none');
        this.hangUpButton.removeClass('d-none');
    
        // Делаем ИСХОДЯЩИЙ звонок
        // Принимать звонки этот код не умеет!
        this.session = this._ua.call(number, {
            pcConfig:
            {
                hackStripTcp: true, // Важно для хрома, чтоб он не тупил при звонке
                rtcpMuxPolicy: 'negotiate', // Важно для хрома, чтоб работал multiplexing. Эту штуку обязательно нужно включить на астере.
                iceServers: []
            },
            mediaConstraints:
            {
                audio: true, // Поддерживаем только аудио
                video: false
            },
            rtcOfferConstraints:
            {
                offerToReceiveAudio: 1, // Принимаем только аудио
                offerToReceiveVideo: 0
            }
        });
    
        // Это нужно для входящего звонка, пока не используем
        this._ua.on('newRTCSession', (data) => {
            if (!this._mounted)
                return;
    
            if (data.originator === 'local')
                return;
    
            // audioPlayer.play('ringing');
        });
    
        // Астер нас соединил с абонентом
        this.session.on('connecting', () => {
            console.log("UA session connecting");
            this.playSound("ringback.ogg", true);
    
            // Тут мы подключаемся к микрофону и цепляем к нему поток, который пойдёт в астер
            let peerconnection = this.session.connection;
            let localStream = peerconnection.getLocalStreams()[0];
    
            // Handle local stream
            if (localStream) {
                // Clone local stream
                this._localClonedStream = localStream.clone();
    
                console.log('UA set local stream');
    
                let localAudioControl = document.getElementById("localAudio");
                localAudioControl.srcObject = this._localClonedStream;
            }
    
            // Как только астер отдаст нам поток абонента, мы его засунем к себе в наушники
            peerconnection.addEventListener('addstream', (event) => {
                console.log("UA session addstream");
    
                let remoteAudioControl = document.getElementById("remoteAudio");
                remoteAudioControl.srcObject = event.stream;
            });
        });
    
        // В процессе дозвона
        this.session.on('progress', () => {
            console.log("UA session progress");
            this.playSound("ringback.ogg", true);
        });
    
        // Дозвон завершился неудачно, например, абонент сбросил звонок
        this.session.on('failed', (data) => {
            console.log("UA session failed");
            this.stopSound("ringback.ogg");
            this.playSound("rejected.mp3", false);
    
            this.callButton.removeClass('d-none');
            this.hangUpButton.addClass('d-none');
        });
    
        // Поговорили, разбежались
        this.session.on('ended', () => {
            console.log("UA session ended");
            this.playSound("rejected.mp3", false);
            JsSIP.Utils.closeMediaStream(this._localClonedStream);
    
            this.callButton.removeClass('d-none');
            this.hangUpButton.addClass('d-none');
        });
    
        // Звонок принят, можно начинать говорить
        this.session.on('accepted', () => {
            console.log("UA session accepted");
            this.stopSound("ringback.ogg");
            this.playSound("answered.mp3", false);
        });

    }

    hangUp() {
        console.log('hangUp');
        this.session.terminate();
        JsSIP.Utils.closeMediaStream(this._localClonedStream);
    }

    login() {
        // console.log('asterisk login');

        let login = 'user';
        let pwd = 'pwd';
        
        localStorage.setItem("login", login);
        localStorage.setItem("pwd", pwd);
    
        socket = new JsSIP.WebSocketInterface("wss://YOUR_SERVER:PORT/ws");
        this._ua = new JsSIP.UA(
            {
                uri: "sip:" + login + "@YOUR_SERVER",
                password: pwd,
                display_name: login,
                sockets: [socket]
            });
    
        // соединяемся с астером
        this._ua.on('connecting', () => {
            console.log("UA connecting");
        });
    
        // соединились с астером
        this._ua.on('connected', () => {
            console.log("UA connected");
        });
    
        // астер нас зарегал, теперь можно звонить и принимать звонки
        this._ua.on('registered', () => {
            console.log("UA registered");
            //активируем кнопки
        });
    
        // астер про нас больше не знает
        this._ua.on('unregistered', () => {
            console.log("UA unregistered");
        });
    
        // астер не зарегал нас, что то не то, скорее всего неверный логин или пароль
        this._ua.on('registrationFailed', (data) => {
            console.error("UA registrationFailed", data.cause);
        });
    
        // заводим шарманку
        this._ua.start();
    }

    logout() {
        console.log("on logout");
        // декативируем кнопки

    
        // закрываем всё нафиг, вылогиниваемся из астера, закрываем коннект
        this._ua.stop();
    }

    playSound(soundName, loop) {
        this._soundsControl.pause();
        this._soundsControl.currentTime = 0.0;
        this._soundsControl.src = "sounds/" + soundName;
        this._soundsControl.loop = loop;
        this._soundsControl.play();
    }

    stopSound() {
        this._soundsControl.pause();
        this._soundsControl.currentTime = 0.0;
    }

    init() {
        this.a1 = document.createElement('audio');
        this.a1.id = "localAudio";
        this.a1.autoplay = true;
        this.a1.muted = true;
        this.a2 = document.createElement('audio');
        this.a2.id = "remoteAudio";
        this.a2.autoplay = true;
        this.a3 = document.createElement('audio');
        this.a3.id = "sounds";
        this.a3.autoplay = true;
        // a1.src = "http://localhost/a1.mp3";
        // this.a1.src="https://html5book.ru/examples/media/track.mp3"
        document.body.appendChild(this.a1);
        document.body.appendChild(this.a2);
        document.body.appendChild(this.a3);
    }

    ready() {
        setButtons(this.app, this.app.config.getButt(this.getRoot().getBody()));
        let app = this.app;
        let th = this;
        this._soundsControl = document.getElementById("sounds");
        this.login();
    }

}
