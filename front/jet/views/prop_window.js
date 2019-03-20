"use strict";

import {JetView} from "webix-jet";
import {request} from "../views/globals";
import {defaultScreens} from "../models/variables"; 

export default class PropView extends JetView{
    config(){
        let app = this.app;
        let dValue;

        defaultScreens.forEach( (item) => {
            if (item.value1 === app.config.defaultView) dValue = item.id;
        });

        let body = { view: "form",
            localId: "prop_form",
            margin: 0,
            elements: [
                {rows: [
                    //{view: "label", label:"Пользователь:   " + app.config.user},
                    //{height: 10},
                    {view:"counter", label:"Количество отображаемых строк в таблице:", value: 20, labelWidth: 270, width: 370, step: 1, align: 'left', min: 1, max: 50,
                        name: "posPpage", localId: "_ppage",
                        },
                    {height: 10},
                    {view: "checkbox", label:"Получать уведомления", value: 1, labelWidth: 270, width: 370, readonly: !true, localId: "notify",
                        name: "notify",
                        on: {
                            onChange: () => {
                                if (this.$$("notify").getValue() === 1) {
                                    this.$$("nTime").show();
                                } else if (this.$$("notify").getValue() === 0) {
                                    this.$$("nTime").hide();
                                    };
                                }
                            }
                        },
                    {height: 10},
                    {view: "counter", label: "Время вывода уведомлений", value: 3, labelWidth: 270, width: 370, step: 1, align: 'left', min: 0, max: 30, readonly: !true, localId: "nTime",
                        name: 'nDelay',
                        hidden: true,
                        },
                    {height: 10},
                    {view: "checkbox", label: 'Вид кнопок "Эксперт"', value: 1, labelWidth: 270, width: 370, readonly: !true, localId: "expert",
                        name: "expert"},
                    {height: 10},
                    {view: "checkbox", label: "Запоминать окна и параметры поиска", value: 0, labelWidth: 270, width: 370, readonly: true, localId: "save",
                        name: "save"},
                    {height: 10},
                    {view: "combo", label: "Вкладка по умолчанию", labelWidth: 170, width: 370,
                        options: defaultScreens, value: dValue,
                        name: "default", localId: "_default",
                    },
                    {view: "checkbox", 
                        label: "<span>Я </span>" + "<span style='color:red; font-weight: bold'>НЕ</span>" + "<span> собираюсь сводить</span>", 
                        value: 0, labelWidth: 270, width: 370, readonly: !true, localId: "link",
                        name: "link", hidden: true,
                        },
                    {height: 15},
                    {view: "label", label: "<span style='color: red'>После сохранения настроек страница будет обновленна</span>"},
                    {height: 15},
                    {cols: [
                        {view: "button", type: "base", label: "Отменить", width: 120, height: 32,
                            click: () => {
                                this.hide_w();
                                }
                            },
                        {},
                        {view: "button", type: "base", label: "Сохранить", width: 120, height: 32,
                            click: () => {
                                let pars = this.$$("prop_form").getValues();
                                let url = app.config.r_url + "?setExpert";
                                let params = {"user":app.config.user, "expert": (pars.expert) ? "1" : "5"};
                                request(url, params);
                                delete pars.expert;
                                pars.default = "LinkerView";
                                let dView = this.$$("_default").getValue();
                                defaultScreens.forEach( (item) => {
                                    if (+item.id === +dView) pars.default = item.value1;
                                })
                                pars.nDelay = pars.nDelay*1000;
                                url = app.config.r_url + "?saveParams";
                                params = {'user': app.config.user, 'pars': pars}
                                request(url, params);
                                //webix.message({type: "event", text: "Сохранение настроек пока не доступно", expire: 4000});
                                this.hide_w();
                                location.href = (location.hostname === 'localhost') ? "http://localhost:8080" : "/linker/";
                                }
                            }
                        ]}
                    ]}
                ],
            }

        return {view: "cWindow",
            modal: true,
            body: body
            }
        }

    ready() {
        if (this.$$("notify").getValue() === 1) {
            this.$$("nTime").show();
        } else if (this.$$("notify").getValue() === 0) {
            this.$$("nTime").hide();
            };
        }
        
    show_w(new_head){
        let app = this.app;
        this.getRoot().getHead().getChildViews()[0].setValue(new_head);
        this.$$("_ppage").setValue(app.config.posPpage);
        this.$$("notify").setValue(app.config.notify);
        this.$$("nTime").setValue(app.config.nDelay/1000);
        this.$$("expert").setValue((app.config.expert===true) ? 1 : 0);
        this.$$("save").setValue(app.config.save);
        this.$$("link").setValue(app.config.link);
        
        this.getRoot().show()
        }
    hide_w(){
        this.getRoot().hide()
        }
    init() {
        }
    }


