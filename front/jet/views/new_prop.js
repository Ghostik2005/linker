"use strict";

import {JetView} from "webix-jet";
import {request, checkVal} from "../views/globals";


export default class NewPropView extends JetView{
    config(){
        let app = this.app;

        function check_s(value) {
            let url = this.$scope.app.config.r_url + "?check" + this.config._params.type
            let params = {};
            params['check'] = value;
            params['user'] = this.$scope.app.config.user;
            var ret = false;
            let res = request(url, params, !0).response;
            res = checkVal(res, 's');
            if (res || (this.config._params.text===value)) {
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
                    "text": check_s,
                    },
                elements: [
                    {view: "text", localId: "_id",label: "ID", value: "", width: 380, name: "id", placeholder: "Введите значение", readonly: false,
                        required: !true, invalidMessage: "Такой ID уже есть", hidden: true,
                    },
                    {view: "text", label: "Название", value: "", width: 380, name: "text", placeholder: "Введите значение",
                        required: true, invalidMessage: "Неверное название", localId: "_text"
                    },
                    {view: "text", label: "Веб-сайт", value: "", width: 380, name: "website", 
                        hidden: true,
                        localId: "_web"
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
                                    params['index'] = para.index;
                                    params['website'] = _f.website;
                                    let url = (para.mode === 'new') ? this.app.config.r_url + "?set" + para.type
                                                                    : this.app.config.r_url + "?upd" + para.type;
                                    let res = request(url, params, !0).response;
                                    res = checkVal(res, 's');
                                    if (res) {
                                        if (para.type==='Issue') {
                                            para.callback('AllIs', res, para.source);
                                        } else if (para.type==='Sez') {
                                            para.callback('Sezon', res, para.source);
                                        } else if (para.type==='Gr') {
                                            para.callback('Group', res, para.source);
                                        } else {
                                            para.callback(para.type, res, para.source);
                                        };
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
        
    show(new_head, params, genid){
        
        let app = this.app;
        this.$$("_n_f").config._params = params;
        if (params.type === "Vendor") {
            this.$$("_web").show();
        } else {
            this.$$("_web").hide();
        }
        this.getRoot().getHead().getChildViews()[0].setValue(new_head);
        this.$$("_id").define('readonly', false);
        if (params.id_is) {
            let _p = {'text': params.text, 'id': params.id_is}
            this.$$("_n_f").parse(_p);
            this.$$("_id").define('readonly', true);
            };
        if (params.text) {
            let _p = {'text': params.text, 'id': params.id}
            this.$$("_n_f").parse(_p);
            this.$$("_id").define('readonly', true);
        } else {
            if (genid) {
                let url = app.config.r_url + "?genGrId";
                let params = {"user": app.config.user};
                this.$$("_id").define('readonly', true);
                let data = request(url, params, !0).response;
                data = checkVal(data, 's');
                if (data) {
                    ///console.log('data', data);
                    this.$$("_id").setValue(data);
                };
            };
        };
        if (params.website) {
            this.$$("_web").setValue(params.website)
        };
        this.$$("_id").refresh();
        this.getRoot().show();
        this.$$("_text").focus();
        }
    hide(){
        this.getRoot().hide()
        }
    getValues() {
        return this.getRoot().getBody().getValues();
        }

    }


