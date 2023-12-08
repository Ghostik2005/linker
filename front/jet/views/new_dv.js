//"use strict";

import { JetView } from "webix-jet";
import { request, checkVal } from "../views/globals";
import NewIssueView from "../views/new_issue";
import NewOaIssueView from "../views/new_oa_issue";


export default class NewDvView extends JetView {
    config() {

        function check_s(value) {
            let url = "check" + this.config._params.type
            let params = {};
            params['check'] = value;
            params['user'] = this.$scope.app.config.user;
            var ret = false;
            let res = request(url, params, !0, this.$scope.app).response;
            res = checkVal(res, 's');
            if (res || (this.config._params.text === value)) {
                ret = true
            }
            return ret;
        }

        return {
            view: "cWindow",
            modal: true,
            on: {
                onHide: () => {
                    this.$$("_n_f").clear();
                    this.$$("_n_f").clearValidation();
                }
            },
            body: {
                view: "form",
                localId: "_n_f",
                _params: {},
                margin: 0,
                rules: {
                    "id": check_s,
                    "text": check_s, //webix.rules.isNotEmpty,
                },
                elements: [
                    {
                        view: "text", localId: "_id", label: "ID", value: "", name: "id", placeholder: "Введите значение", readonly: true,
                        required: !true, invalidMessage: "Такой ID уже есть", hidden: true,
                    },
                    {
                        view: "text", label: "Название", value: "", name: "text", placeholder: "Введите значение",
                        required: true, invalidMessage: "Неверное название"
                    },
                    {
                        view: "select", label: "Обязательный ассортимент", value: 3, labelWidth: 200, width: 450, name: "oa",
                        // сделаем загрузку с сервера 
                        options: [
                            { id: 3, value: "Нет" }, // the initially selected value
                            { id: 1, value: "Для аптек" },
                            { id: 2, value: "Для аптек и аптечных пунктов" }
                        ],
                        labelAlign: "left"
                    },
                    {
                        view: "text", label: "Формы выпуска ОА", value: "",
                        labelWidth: 200,
                        labelPosition: "left", readonly: true,
                        name: "prod_forms_text",
                        localId: "_issue",
                        css: "raw_text",
                        current_ids: [],
                        readonly: true,
                        click: () => {
                            let id_dv = this.$$("_n_f").getValues().id;
                            this.edit_issue.show(
                                "Редактирование форм выпуска",
                                id_dv,
                                this,
                                undefined,
                                "getDvIs",
                                "_issue"
                            );
                        }
                    },
                    {
                        hidden: true,
                        view: "select", label: "Cравнение форм выпуска",
                        labelWidth: 200, value: 1, width: 450, name: "compare_prod_forms",
                        options: [
                            { id: 1, value: "И" },
                            { id: 2, value: "ИЛИ" }
                        ],
                        labelAlign: "left"
                    },
                    {
                        view: "text", label: "Формы выпуска ОА для АП",
                        value: "",
                        labelWidth: 200,
                        labelPosition: "left", readonly: true,
                        name: "prod_forms_ap_text",
                        localId: "_issue_ap",
                        css: "raw_text",
                        current_ids: [],
                        readonly: true,
                        click: () => {
                            let id_dv = this.$$("_n_f").getValues().id;
                            this.edit_issue.show(
                                "Редактирование форм выпуска",
                                id_dv,
                                this,
                                undefined,
                                "getDvIsAp",
                                "_issue_ap"
                            );
                        }
                    },
                    {
                        hidden: true,
                        view: "select", label: "Cравнение форм выпуска для АП",
                        labelWidth: 200, value: 1, width: 450, name: "compare_prod_forms_ap",
                        options: [
                            { id: 1, value: "И" },
                            { id: 2, value: "ИЛИ" }
                        ],
                        labelAlign: "left"
                    },


                    { height: 15 },
                    {
                        height: 30, cols: [
                            {
                                view: "button", type: "base", label: "Отменить", width: 120,
                                click: () => {
                                    this.hide();
                                }
                            },
                            {},
                            {
                                view: "button", type: "base", label: "Сохранить", width: 120,
                                click: () => {
                                    let valid = this.$$("_n_f").validate({ hidden: false, disabled: false });
                                    console.log(valid);
                                    if (valid) {
                                        let _f = this.$$("_n_f").getValues();
                                        let params = {};
                                        let para = this.$$("_n_f").config._params;
                                        params['value'] = _f.text;
                                        params['user'] = this.app.config.user;
                                        params['id'] = (para.mode === 'upd') ? para.id : _f.id;
                                        params['oa'] = _f.oa;
                                        params["issue_forms"] = this.$$("_issue").current_ids;
                                        params["issue_forms_text"] = _f.prod_forms_text;
                                        // params["compare_prod_forms"] = _f.compare_prod_forms;

                                        params["issue_forms_ap"] = this.$$("_issue_ap").current_ids;
                                        params["issue_forms_ap_text"] = _f.prod_forms_ap_text;
                                        // params["compare_prod_forms_ap"] = _f.compare_prod_forms_ap;
                                        let url = (para.mode === 'new') ? "set" + para.type : "upd" + para.type;
                                        let res = request(url, params, !0, this.app).response;
                                        res = checkVal(res, 's');
                                        console.log(res);
                                        if (res) {
                                            para.callback("Dv", res, para.source);
                                        };
                                        this.hide();
                                    }
                                }
                            }
                        ]
                    }
                ],
            }
        }
    }

    show(new_head, params) {
        this.$$("_n_f").config._params = params;
        this.getRoot().getHead().getChildViews()[0].setValue(new_head);
        if (params.mode === 'upd') {
            let oa = (params.oa === "Для аптек") ? 1 :
                (params.oa === "Для аптек и аптечных пунктов") ? 2 :
                    3;
            let _p = {
                'text': params.text,
                'id': params.id,
                'oa': oa,
                "prod_forms_text": params.prod_forms_text,
                "prod_forms_ap_text": params.prod_forms_ap_text,
                "compare_prod_forms_ap": params.compare_prod_forms_ap,
            }
            this.$$("_n_f").parse(_p);
            this.$$("_id").define('readonly', true);
        } else {
            this.$$("_id").define('readonly', false);
        }
        this.$$("_id").refresh();
        this.getRoot().show();
    }

    hide() {
        this.getRoot().hide()
    }

    init() {
        this.popis = this.ui(NewIssueView);
        this.edit_issue = this.ui(NewOaIssueView);
    }

    getValues() {
        return this.getRoot().getBody().getValues();
    }

}


