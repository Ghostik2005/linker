"use strict";

import {JetView} from "webix-jet";
import {checkVal} from "../views/globals";
 

export default class uplBrakXlsView extends JetView{
    config(){
        let app = this.app;

        var row_format = function (view) {
            var data = view.data.order;
            data.forEach(function(item) {
                let obj = view.getItem(item);
                obj.$css = (obj.result) ? "shadow":
                           "";
                });
            view.refresh()
            };

        let ww = {view:"uploader",
            localId: "_uploader",
            accept:"application/vnd.ms-excel,",
            apiOnly:true,
            urlData:{
                },
            link: undefined,//"mylist",
            upload: app.config.r_url + "?checkBrakXls",
            datatype:"json",
            on: {
                onBeforeFileAdd:function(item){
                    var type = item.type.toLowerCase();
                    if (type != "xls"){
                        webix.message({type: "error", text: "Поддерживаются только XLS-файлы", delay: 800});
                        return false;
                        }
                    },
                onFileUploadError: () => {
                    this.view.$$("__table").hideProgress();
                    },
                onAfterFileAdd: (obj) => {
                    this.view.$$("__table").hideOverlay();
                    this.view.$$("__table").clearAll();
                    this.view.$$("_show").config.filter = false;
                    this.view.$$("__table").showProgress({
                        type: "icon",
                        icon: '<i class="fa fa-spinner fa-spin fa-3x fa-fw"></i>'
                        });                                
                    this.$$("_uploader").files.data.each((obj) => {
                        obj.urlData = {"filename":obj.name, "source": 'linker'};
                        this.$$("_uploader").send(obj.id);
                        }); 
                    },
                onUploadComplete: (obj) => {
                    this.view.$$("__table").hideProgress();
                    if (obj.result) {
                        obj = obj.ret_val;
                        if (obj) {
                            this.view.$$("__table").parse(obj);
                            this.view.$$("__table").adjustRowHeight("title");
                            row_format(this.view.$$("__table"));
                            };
                    } else{
                        let msg = obj.ret_val;
                        
                        this.view.$$("__table").showOverlay( (msg) ? msg : "Ошибка загрузки"); 
                        }
                    
                    },
                },
            }

        return ww
        }

    ready() {
        }
    
    show_window(view){
        this.view = view;
        // this.getRoot().getHead().getChildViews()[0].setValue('Загрузка брака XLS');
        // this.getRoot().show();
        this.$$("_uploader").fileDialog();
        }

    hide_window() {
        this.getRoot().hide()
        }
        
    init() {
        }
    }
