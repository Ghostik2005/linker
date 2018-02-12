//"use strict";

import {JetView} from "webix-jet";
import {request, checkVal, prcs, delPrc} from "../views/globals";


export default class NewDvView extends JetView{
    config(){
        
        function check_s(value) {
            let url = this.$scope.app.config.r_url + "?check" + this.config._params.type
            let params = {};
            params['check'] = value;
            params['user'] = this.$scope.app.config.user;
            var ret = false;
            if (this.$scope.$$("_n_f").config._params.mode=='new') {
                let res = request(url, params, !0).response;
                res = checkVal(res, 's');
                if (res || this.config._params.text) {
                    ret = true
                    }
                } else {
                    ret = true;
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
                    {view: "text", localId: "_id",label: "ID", value: "", name: "id", placeholder: "Введите значение", readonly: true, //width: 320,
                        required: true, invalidMessage: "Такой ID уже есть"
                        },
                    {view: "text", label: "Название", value: "", name: "text", placeholder: "Введите значение", //width: 320, 
                        required: true, invalidMessage: "Введите название"
                        },
                    {view: "select", label: "Обязательный ассортимент", value: 3, labelWidth: 200, width: 450, name: "oa", //placeholder: "Введите значение",
                        //required: true, invalidMessage: "Введите название"
                        // сделаем загрузку с сервера 
                        options:[
                            {id:3, value:"Нет" }, // the initially selected value
                            {id:1, value:"Для аптек"},
                            {id:2, value:"Для аптек и аптечных пунктов"}
                            ],
                            labelAlign:"left"
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
                                //let valid = true;
                                if (valid) {
                                    let _f = this.$$("_n_f").getValues();
                                    let params = {};
                                    let para = this.$$("_n_f").config._params;
                                    params['value'] = _f.text;
                                    params['user'] = this.app.config.user;
                                    params['id'] = (para.mode === 'upd') ? para.id : _f.id;
                                    params['oa'] = _f.oa;
                                    let url = (para.mode === 'new') ? this.app.config.r_url + "?set" + para.type
                                                                    : this.app.config.r_url + "?upd" + para.type;
                                    //console.log(params);
                                    let res = request(url, params, !0).response;
                                    res = checkVal(res, 's');
                                    if (res) {
                                        para.callback(res, para.source);
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
        if (params.mode === 'upd') {
            let oa = (params.oa === "Для аптек") ? 1:
                     (params.oa === "Для аптек и аптечных пунктов") ? 2:
                     3;
            let _p = {'text': params.text, 'id': params.id, 'oa': oa}
            this.$$("_n_f").parse(_p);
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


