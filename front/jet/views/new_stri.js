"use strict";

import {JetView} from "webix-jet";
import {request, checkVal} from "../views/globals";


export default class NewstriView extends JetView{
    config(){
        
        function check_s(value) {
            let para = this.config._params;
            let url = this.$scope.app.config.r_url + "?check" + para.url
            let params = {};
            params[para.new_name] = value;
            params['user'] = this.$scope.app.config.user;
            let res = request(url, params, !0).response;
            res = checkVal(res, 's');
            var ret = false;
            if (res) {
                ret = true
                };
            return ret;
            }
            
        return {view: "cWindow",
            modal: true,
            on: {
                onHide: () => {
                    this.$$("_n_f").clear();
                    this.$$("_n_f").clearValidation();
                    }
                },
            body: { view: "form",
                localId: "_n_f",
                _params: {},
                margin: 0,
                rules:{
                    "_new_str": check_s,
                    },
                elements: [
                    {view: "text", label: "Название", value: "", width: 320, name: "_new_str", required: true, placeholder: "Введите новое значение",
                        invalidMessage: "Такое название уже есть"
                        },
                    {cols: [
                        {view: "button", type: "base", label: "Отменить", width: 120,
                            click: () => {
                                this.hide();
                                }
                            },
                        {},
                        {view: "button", type: "base", label: "Сохранить", width: 120,
                            click: () => {
                                let valid = this.$$("_n_f").validate({hidden:false, disabled:false});
                                if (valid) {
                                    let _f = this.$$("_n_f").getValues();
                                    let params = {};
                                    let para = this.$$("_n_f").config._params;
                                    params[para.new_name] = _f._new_str;
                                    params['user'] = this.app.config.user;
                                    params['id_spr'] = (para.id_spr) ? para.id_spr : false;
                                    let url = this.app.config.r_url + "?set" + para.url;
                                    let res = request(url, params, !0).response;
                                    res = checkVal(res, 's');
                                    if (res) {
                                        para.callback(res);
                                        };
                                    this.hide();
                                } else {

                                    }
                                }
                            }
                        ]}
                    ],
                }
            }
        }
    show(new_head, params){
        this.$$("_n_f").config._params = params;
        this.getRoot().getHead().getChildViews()[0].setValue(new_head);
        this.getRoot().show();
        }
    hide(){
        this.getRoot().hide()
        }
    getValues() {
        return this.getRoot().getBody().getValues();
        }

    }


