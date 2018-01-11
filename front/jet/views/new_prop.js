//"use strict";

import {JetView} from "webix-jet";
import {request, prcs, delPrc} from "../views/globals";


export default class NewPropView extends JetView{
    config(){
        
        function check_s(value) {
            let url = this.$scope.app.config.r_url + "?check" + this.config._params.type
            let params = {};
            params['check'] = value;
            params['user'] = this.$scope.app.config.user;
            let ret_data = request(url, params, !0).response;
            ret_data = JSON.parse(ret_data);
            var ret = false;
            if (ret_data.ret_val || this.config._params.text) {
                ret = true
            } else {
                //webix.message('error');
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
                    "id": check_s,
                    "text": webix.rules.isNotEmpty,
                    },
                elements: [
                    {view: "text", localId: "_id",label: "ID группы", value: "", width: 320, name: "id", placeholder: "Введите значение", readonly: true,
                        required: true, invalidMessage: "Такой ID уже есть"
                        },
                    {view: "text", label: "Название", value: "", width: 320, name: "text", placeholder: "Введите значение",
                        required: true, invalidMessage: "Введите название"
                        },
                    {height: 15},
                    {height: 30, cols: [
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
                                    params['value'] = _f.text;
                                    params['user'] = this.app.config.user;
                                    params['id'] = (para.text) ? para.id : _f.id;
                                    let url = this.app.config.r_url + "?set" + para.type
                                    let ret_data = request(url, params, !0).response;
                                    ret_data = JSON.parse(ret_data);
                                    if (ret_data.result) {
                                        para.callback(ret_data.ret_val);
                                    } else {
                                        //webix.message('error');
                                        };
                                    this.hide();
                                } else {
                                    }
                                }
                            }
                        ]}
                    ],
            on: {
                onBeforeShow: function() {
                    },
                onShow: function() {
                    }
                }
            }
            }
        }
    show(new_head, params){
        this.$$("_n_f").config._params = params;
        this.getRoot().getHead().getChildViews()[0].setValue(new_head);
        if (params.text) {
            this.$$("_n_f").parse(params);
            this.$$("_id").define('readonly', true);
        } else {
            this.$$("_id").define('readonly', false);
            }
        this.$$("_id").refresh();
        this.getRoot().show();
        }
    hide(){
        this.getRoot().hide()
        }
    getValues() {
        return this.getRoot().getBody().getValues();
        }

    }


