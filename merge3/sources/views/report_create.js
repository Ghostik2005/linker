"use strict";

import {JetView} from "webix-jet";


export default class crReportView extends JetView{
    config(){
        let app = this.app;
        return {view: "cWindow",
            modal: true,
            // height: document.documentElement.clientHeight * 0.8,
            on: {
                onHide: () => {
                    this.$$("_tb").clear();
                    this.$$("_tb").reconstruct();
                    }
                },
            body: {view: 'toolbar',
                localId: "_tb",
                searchBar: undefined,
                rows: [
                    {height: document.documentElement.clientHeight * 0.6, 
                        localId: "_layout", view: "form", 
                        cols: []
                    },
                    {width: document.documentElement.clientWidth * 0.7, cols: [
                        {},
                        {view: "button", type: "htmlbutton", localId: "_save",
                            tooltip: "Сохранить",
                            label: "<span style='line-height: 18px; font-size: smaller'>ОК</span>",
                            width: 80, height: 36,
                            on: {
                                onItemClick: () => {
                                    // let inns = [];
                                    let inns = undefined;
                                    let views = this.$$("_layout").getChildViews();
                                    views.forEach( (view) => {
                                        inns = inns || view.getValue();
                                    })

                                    if (!inns) return

                                    // this.$$("_layout").getChildViews().forEach(view => {
                                    //     view.getChildViews().forEach( box => {
                                    //         let v = box.getValue();
                                    //         if (v) inns.push(box.config.tooltip);
                                    //     });
                                    // });
                                    // console.log('inns', inns);
                                    // let inns = '9999999999'; // берем спискр инн в зависимости от выделенных галочек
                                    // if (inns.length > 0) {
                                        let url = app.config.r_url + "?makeReport";
                                        let params = {
                                            "user": app.config.user,
                                            "inn": inns,
                                            };
                                        webix.html.addCss(this.parent.$view, 'anibut');
                                        this.parent.blockEvent();
                                        webix.ajax().timeout(600000).headers({'Content-type': 'application/json'}).response("blob").post(url, params, (text, data, xmlhttpreq) => {
                                            let f_n = xmlhttpreq.getResponseHeader('content-disposition').split('filename=')[1].replace(/^\s+|\s+$/g, '')
                                            webix.html.download(data, f_n);//"report." + params.type);
                                            this.parent.unblockEvent();
                                            webix.html.removeCss(this.parent.$view, 'anibut');
                                            })
                                        this.hide();
                                    // }
                                }
                            }
                        },
                        {width: 10},
                    ]}
                ]}
            }
        }

    show(parent, inns){
        this.getRoot().getHead().getChildViews()[0].setValue('Отчет по связкам. Выберите организации для отчета');
        this.getRoot().show();
        // парсим инн и организации в наш тулбар вместе с чекбоксами
        let maxC = Math.floor(this.$$("_layout").config.height / 35);
        let cols = Math.ceil(inns.length / maxC);
        for (let k = 0; k<cols; k++) {
            let options = [];
            for (let j = 1; j <= maxC; j++) {
                let inn;
                inn = inns.shift();
                if (!inn) break;
                let o = { id: inn.inn , value: inn.c_v};
                options.push(o)
            }

            let v = {
                // view: "form",
                view: 'radio',
                labelAlign: 'right',
                vertical:true,
                align:"left",
                width: this.$$("_layout").config.width / cols,
                // margin: 0,
                // padding: 0,
                borderless: 1,
                options: options,
                // elements: []
                on: {
                    onItemClick: function() {
                        let cid = this.config.id;
                        let views = this.getParentView().getChildViews();
                        views.forEach( (view) => {
                            if (view.config.id != cid) view.setValue();
                        })
                    }
                }
            }
            this.$$("_layout").addView(v)
        };

        // let colViews = this.$$("_layout").getChildViews()
        // colViews.forEach(view => {
        //     for (let k = 1; k <= maxC; k++) {
        //         let inn;
        //         inn = inns.shift();
        //         if (!inn) break;
        //         let v = {
        //             view: "checkbox", labelRight: inn.c_v, tooltip: inn.inn, value: 1, labelWidth: 0, //width: 170, 
        //             labelAlign:"right"
        //         };
        //         view.addView(v)
        //     };
        // });

        this.parent = parent;
        this.inns = inns;
    }

    hide(){

        this.getRoot().hide()
        }

        
    init() {
        }
    }
