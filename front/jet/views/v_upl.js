"use strict";

import {JetView} from "webix-jet";

export default class uplMenuView extends JetView{
    config(){
        let app = this.app;
        
        let ww = {
            view: "cWindow",
            modal: false,
            on: {
                onHide: () => {
                    this.$$("__upl_1").files.clearAll();
                    },
                },
            body: {
                view:"form",
                rows:[
                    {view:"uploader",
                        localId: "__upl_1",
                        type:"iconButton",
                        icon:"plus-circle",
                        multiple:false,
                        autosend: false,
                        align: "left",
                        label:"Добавить файл",
                        directory: false,
                        accept:"application/nolink",
                        urlData:{
                            },
                        link: undefined,//"mylist",
                        upload: "http://saas.local/linker_upl",
                        datatype:"json",
                        on: {
                            onUploadComplete: (obj) => {
                                console.log('ok', obj);
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
                            this.$$("__upl_1").files.data.each((obj) => {
                                obj.urlData = {"filename":obj.name, "source": 'linker'};
                                this.$$("__upl_1").send(obj.id);
                                });
                            }
                        },
                    ]
                }
            }
        return ww
        }

    ready() {
        this.$$("__upl_1").define({"link": this.$$("_f_list").config.id});
        this.$$("__upl_1").refresh();
        }
    
    show_window(new_head){
        this.getRoot().getHead().getChildViews()[0].setValue(new_head);
        this.getRoot().show()
        }

    hide_window() {
        this.getRoot().hide()
        }
        
    init() {
        }
    }
