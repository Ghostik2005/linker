"use strict";

import {JetView} from "webix-jet";

export default class uplBrakMenuView extends JetView{
    config(){
        let app = this.app;
        
        let ww = {
            view: "cWindow",
            modal: false,
            on: {
                onHide: () => {
                    this.$$("_uploader").files.clearAll();
                    },
                },
            body: {
                view:"form",
                rows:[
                    {view:"uploader",
                        localId: "_uploader",
                        type:"iconButton",
                        icon:"plus-circle",
                        multiple: true,
                        autosend: false,
                        align: "left",
                        label:"Добавить файл",
                        directory: false,
                        accept:"application/dbf",
                        urlData:{
                            },
                        link: undefined,//"mylist",
                        upload: app.config.r_url + "?uploadBrak",
                        datatype:"json",
                        on: {
                            onUploadComplete: (obj) => {
                                //console.log("obj", obj.ret_val);
                                if (obj.result) {
                                    webix.message({type: "success", text: "брак сохранен", expire: 1500});
                                } else {
                                    webix.message({type: "error", text: obj.ret_val, expire: 1500});
                                    };
                                this.hide_window();
                                
                                },
                            },
                        },
                    {view:"list",
                        //id:"mylist",
                        localId: "_f_list",
                        type:"uploader",
                        autoheight:true,
                        borderless:true
                        },
                    {view: "button", label: "Отправить",
                        type:"iconButton", icon: "upload",
                        click: () => {
                            //return
                            this.$$("_uploader").files.data.each((obj) => {
                                obj.urlData = {"filename":obj.name, "source": 'linker'};
                                this.$$("_uploader").send(obj.id);
                                });
                            }
                        },
                    ]
                }
            }
        return ww
        }

    ready() {
        this.$$("_uploader").define({"link": this.$$("_f_list").config.id});
        this.$$("_uploader").refresh();
        }
    
    show_window(new_head){
        this.getRoot().getHead().getChildViews()[0].setValue(new_head);
        this.getRoot().show();
        this.$$("_uploader").fileDialog();
        }

    hide_window() {
        this.getRoot().hide()
        }
        
    init() {
        }
    }
