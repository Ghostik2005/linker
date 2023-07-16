"use strict";

import { JetView } from "webix-jet";
import NewstriView from "../views/new_stri";
import NewbarView from "../views/new_bar";
import NewtgView from "../views/new_tg";
import NewIssueView from "../views/new_issue";
import { strana, vendor, dv, sezon, nds, group, hran, id521 } from "../views/globals";
import { request, checkVal, prcs, delPrc, barcodes } from "../views/globals";
import { permited_add } from "../models/variables";

import { strana_filter, zavod_filter, dv_filter, gr_filter, sez_filter, hran_filter, nds_filter, id521_filter } from "../views/globals";

export default class NewformView extends JetView {
    config() {

        let app = this.app;

        function check(item) {
            if (item) {
                if (item.toString().length > 0) return true
                else return false
            } else {
                return false
            }
        }
        function addZavod(item) {
            vendor.add(item, 0);
        }

        function addDv(item) {
            dv.add(item, 0);
        }

        return {
            view: "cWindow",
            modal: true,
            on: {
                onHide: function () {
                    barcodes.clearAll();
                    this.$scope.$$("new_form").clear();
                    this.$scope.$$("new_form").reconstruct();
                }
            },
            body: {
                view: "form",
                localId: "new_form",
                margin: 0,
                spr: false,
                search_bar: undefined,
                rules: {
                    "c_tovar": webix.rules.isNotEmpty,
                    "id_strana": webix.rules.isNotEmpty,
                    "id_zavod": webix.rules.isNotEmpty,
                    "id_dv": webix.rules.isNotEmpty,
                    // "id_group": webix.rules.isNotEmpty
                },
                elements: [
                    {
                        rows: [
                            { view: "label", label: "Название товара:", name: 't_name' },
                            { view: "text", label: "", value: "", name: "c_tovar", required: true, css: "raw_text", localId: "inputTxt" },
                            { height: 10, width: 750 },
                            {
                                cols: [
                                    {
                                        rows: [
                                            { view: "label", label: "Страна:", name: "s_name" },
                                            {
                                                view: "combo", width: 400, value: "", name: 'id_strana', required: true,
                                                options: {
                                                    filter: strana_filter,
                                                    body: {
                                                        template: "#c_strana#",
                                                        yCount: 7,
                                                        //data: strana
                                                    }
                                                },
                                                on: {
                                                    onAfterRender: function () {
                                                        this.getList().sync(strana);
                                                    },
                                                    onChange: function (i, ii, iii) {
                                                    }
                                                },
                                            },
                                            { view: "label", label: "Производитель:", name: "v_name" },
                                            {
                                                cols: [
                                                    {
                                                        view: "combo", label: "", value: "", name: "id_zavod", required: true,
                                                        options: {
                                                            filter: zavod_filter,
                                                            body: {
                                                                template: "#c_zavod#",
                                                                yCount: 7,
                                                                //data: vendor
                                                            }
                                                        },
                                                        on: {
                                                            onAfterRender: function () {
                                                                this.getList().sync(vendor);
                                                            }
                                                        },
                                                    },
                                                    {
                                                        view: "button", type: "base", label: "+", width: 30, hidden: !app.config.roles[app.config.role].vendoradd,
                                                        click: () => {
                                                            let params = { 'new_name': 'c_zavod', 'url': "Zavod", "callback": addZavod }
                                                            this.popstri.show("Добавление производителя", params);
                                                        }
                                                    },
                                                ]
                                            },
                                            { view: "label", label: "Д. вещество:", name: 'dv_name' },
                                            {
                                                cols: [
                                                    {
                                                        view: "combo", label: "", value: "", name: "id_dv", required: true,
                                                        options: {
                                                            filter: dv_filter,
                                                            body: {
                                                                autoheight: false,
                                                                view: "list",
                                                                type: { height: "auto" },
                                                                template: "<div class='comboList'>#act_ingr#</div>",
                                                                height: 200,
                                                                yCount: 0,
                                                                //data: dv
                                                            }
                                                        },
                                                        on: {
                                                            onAfterRender: function () {
                                                                this.getList().sync(dv);
                                                            }
                                                        },
                                                    },
                                                    {
                                                        view: "button", type: "base", label: "+", width: 30, hidden: !app.config.roles[app.config.role].vendoradd,
                                                        click: () => {
                                                            let params = { 'new_name': 'act_ingr', 'url': "Dv1", "callback": addDv }
                                                            this.popstri.show("Добавление д.вещества", params);
                                                        }
                                                    },
                                                ]
                                            },
                                            { view: "label", label: "Форма выпуска:" },
                                            {
                                                view: "text", label: "", value: "", labelPosition: "left", readonly: true, name: "issue", localId: "_issue", css: "raw_text",
                                                readonly: true,
                                                click: () => {
                                                    let id_spr = this.$$("new_form").getValues().id_spr;
                                                    this.popis.show("Редактирование форм выпуска", id_spr, this);
                                                }
                                            },
                                            {
                                                view: "text", label: "Штрих-код:", value: "", labelPosition: "top", readonly: true, name: "barcode", localId: "_barc", css: "raw_text",
                                                readonly: true,
                                                click: () => {
                                                    let id_spr = this.$$("new_form").getValues().id_spr;
                                                    this.popbar.show("Редактирование ш.кодов", id_spr, this);
                                                }
                                            },
                                            {
                                                view: "text", label: "Товарная группа:", labelPosition: "top", value: "", name: "c_tgroup", localId: "_c_tgroup", css: "raw_text",
                                                readonly: true,
                                                click: () => {
                                                    let id_spr = this.$$("new_form").getValues().id_spr;
                                                    this.poptg.show("Редактирование товарных групп", id_spr, this);
                                                }
                                            }
                                        ]
                                    },
                                    { width: 5, },
                                    {
                                        rows: [
                                            {
                                                view: "form", css: "borders",
                                                localId: "new_f_right",
                                                elements: [
                                                    { height: 5 },
                                                    {
                                                        cols: [
                                                            { view: "checkbox", labelRight: "Рецептурный", labelWidth: 0, align: "left", name: "_prescr" },
                                                            { view: "checkbox", labelRight: "Обязательный", labelWidth: 0, align: "left", name: "_mandat" },
                                                            { view: "checkbox", labelRight: "ЖВ", labelWidth: 0, align: "left", name: "id_jv" },
                                                        ]
                                                    },
                                                    {
                                                        view: "combo", label: "Сезон:", labelPosition: "top", value: "", name: "id_sezon", css: "small",
                                                        options: {
                                                            filter: sez_filter,
                                                            body: {
                                                                //autoheight:false,
                                                                //view:"list",
                                                                //type:{ height:"auto" },
                                                                template: "#sezon#",
                                                                //height: 400,
                                                                yCount: 5,
                                                                //data: sezon
                                                            }
                                                        },
                                                        on: {
                                                            onAfterRender: function () {
                                                                this.getList().sync(sezon);
                                                            }
                                                        },
                                                    },
                                                    {
                                                        view: "combo", label: "Условия хранения:", labelPosition: "top", value: "", name: "id_usloviya", css: "small",
                                                        options: {
                                                            filter: hran_filter,
                                                            body: {
                                                                //autoheight:false,
                                                                //view:"list",
                                                                //type:{ height:"auto" },
                                                                template: "#usloviya#",
                                                                //height: 400,
                                                                yCount: 5,
                                                                //data: hran
                                                            }
                                                        },
                                                        on: {
                                                            onAfterRender: function () {
                                                                this.getList().sync(hran);
                                                            }
                                                        },
                                                    },
                                                    {
                                                        view: "combo", label: "Группа:", labelPosition: "top", value: "", name: "id_group", css: "small",
                                                        localId: "_local_id_group",
                                                        required: true,
                                                        options: {
                                                            filter: gr_filter,
                                                            body: {
                                                                autoheight: false,
                                                                view: "list",
                                                                type: { height: "auto" },
                                                                template: "<div class='comboList'>#group#</div>",
                                                                height: 200,
                                                                yCount: 0,
                                                                //data: group
                                                            }
                                                        },
                                                        on: {
                                                            onChange: function (new_val, ii, iii) {
                                                                let nds_c = this.$scope.$$('__nds');
                                                                if (new_val == 'ZakMedCtg.1114') {
                                                                    nds_c.setValue("ZakMedCtg.1358")
                                                                } else {
                                                                    nds_c.setValue();
                                                                }
                                                            },
                                                            onAfterRender: function () {
                                                                // console.log('vnd', this.$scope._id_vnd);
                                                                // console.log('u', this.$scope.app.config.user);
                                                                if ((permited_add.users.includes(this.$scope.app.config.user) && this.$scope._id_vnd == 51066) ||
                                                                    (permited_add.users.includes(this.$scope.app.config.user) && this.$scope._id_vnd == 45835) ||
                                                                    (permited_add.users.includes(this.$scope.app.config.user))) {
                                                                    group.serialize().forEach((it) => {
                                                                        if ((it.id != 'ZakMedCtg.1114') && (it.id != 'ZakMedCtg.39')) {
                                                                            this.getList().add(it)
                                                                        }
                                                                    })
                                                                    // } else if  ((permited_add.users.includes(this.$scope.app.config.user) && this.$scope._id_vnd == 45835) ||
                                                                    // (permited_add.users.includes(this.$scope.app.config.user) )){
                                                                    //     this.getList().parse([{id: 'ZakMedCtg.18', group: "Товары для животных"},]);
                                                                    //     this.getList().parse([{id: 'ZakMedCtg.1115', group: "Изделия медицинского назначения"},]);
                                                                    //     this.getList().parse([{id: 'OR', group: "Ортопедия и средства реабилитации"},]);
                                                                    //     this.getList().parse([{id: 'Z', group: "Парфюмерия/косметика/средства личной гигиены"},]);
                                                                    //     this.getList().parse([{id: 'ZakMedCtg.17', group: "Медицинские приборы и оборудование"},]);
                                                                    //     this.getList().parse([{id: 'Д', group: "Товары для детей"},]);
                                                                } else {
                                                                    this.getList().parse(group);
                                                                }

                                                                // if ((permited_add.users.includes(this.$scope.app.config.user) && this.$scope._id_vnd == 45835) ||
                                                                // (permited_add.users.includes(this.$scope.app.config.user) )) {
                                                                //     console.log('1')
                                                                //     this.getList().parse([{id: 'ZakMedCtg.18', group: "Товары для животных"},])
                                                                // } else if (permited_add.users.includes(this.$scope.app.config.user)  && this.$scope._id_vnd == 51066) {
                                                                //     console.log('2')
                                                                //     group.serialize().forEach((it) => {
                                                                //         if (it.id != 'ZakMedCtg.1114') {
                                                                //             this.getList().add(it)
                                                                //         }
                                                                //     })
                                                                // } else {
                                                                //     console.log('3')
                                                                //     this.getList().parse(group);
                                                                // }
                                                            }
                                                        },
                                                    },
                                                    {
                                                        view: "combo", label: "НДС:", labelPosition: "top", value: "", name: "id_nds", css: "small",
                                                        localId: '__nds',
                                                        options: {
                                                            filter: nds_filter,
                                                            body: {
                                                                template: "#nds#",
                                                                yCount: 5,
                                                                //data: nds
                                                            }
                                                        },
                                                        on: {
                                                            onAfterRender: function () {
                                                                this.getList().sync(nds);
                                                            }
                                                        },
                                                    },
                                                    {
                                                        view: "combo", label: "Код ном.:", labelPosition: "top", value: "", name: "id_521", css: "small",
                                                        localId: "__id_521",
                                                        options: {
                                                            filter: id521_filter,
                                                            body: {
                                                                template: "#id_521#",
                                                                yCount: 5,
                                                            }
                                                        },
                                                        on: {
                                                            onAfterRender: function () {
                                                                this.getList().sync(id521);
                                                            }
                                                        },
                                                    },
                                                ]
                                            }
                                        ]
                                    }
                                ]
                            },
                            {
                                cols: [
                                    {
                                        view: "button", type: "base", label: "Отменить", width: 120, height: 32,
                                        click: () => {
                                            this.hide();
                                        }
                                    },
                                    {},
                                    (app.config.roles[app.config.role].spredit || permited_add.users.includes(app.config.user))
                                        ? {
                                            view: "button", type: "base", label: "Сохранить", width: 120, height: 32, localId: "_save",
                                            hidden: !(app.config.roles[app.config.role].spredit || permited_add.users.includes(app.config.user)),
                                            click: () => {
                                                let valid = this.$$("new_form").validate({ hidden: false, disabled: false });
                                                if (valid) {
                                                    let left_f = this.$$("new_form").getValues();
                                                    let right_f = this.$$("new_f_right").getValues();
                                                    let params = {};
                                                    params["id_spr"] = (left_f.id_spr) ? left_f.id_spr : -1;
                                                    params["barcode"] = left_f.barcode;
                                                    params["issue"] = left_f.issue;
                                                    params["c_tovar"] = left_f.c_tovar;
                                                    params["id_strana"] = left_f.id_strana;
                                                    params["id_zavod"] = left_f.id_zavod;
                                                    params["id_dv"] = left_f.id_dv;
                                                    params["c_opisanie"] = left_f.c_opisanie;
                                                    params["prescr"] = (right_f._prescr === 1) ? true : false;
                                                    params["mandat"] = (right_f._mandat === 1) ? true : false;
                                                    params["id_jv"] = (right_f.id_jv === 1) ? true : false;
                                                    params["id_sezon"] = right_f.id_sezon;
                                                    params["id_usloviya"] = right_f.id_usloviya;
                                                    params["id_group"] = right_f.id_group;
                                                    params["id_521"] = this.$$("__id_521").getText();
                                                    params["id_nds"] = right_f.id_nds;
                                                    //params["sh_prc"] = (this.$$("new_form").config.spr) ? prcs.getItem(prcs.getCursor()).sh_prc : undefined;
                                                    if (this.p_item) {
                                                        let t1 = $$("prcs_dc").getCursor();
                                                        if (t1 && $$("prcs_dc").getItem(t1).sh_prc) params["sh_prc"] = $$("prcs_dc").getItem(t1).sh_prc || undefined;
                                                        else params["sh_prc"] = undefined;
                                                    } else {
                                                        params["sh_prc"] = undefined;
                                                    }
                                                    params["c_tgroup"] = left_f.c_tgroup;
                                                    params["user"] = this.app.config.user;
                                                    params["id_521"] = right_f.id_521
                                                    let url = "setSpr";
                                                    let res = request(url, params, !0, this.app).response;
                                                    res = checkVal(res, 's');
                                                    if (res && res.new && this.$$("new_form").config.spr) {
                                                        delPrc(params, this);
                                                    } else {
                                                        this.$$("new_form").config.search_bar.callEvent('onKeyPress', [13,]);
                                                    };
                                                    this.$$("new_form").config.spr = false;
                                                    this.hide();
                                                };
                                            }
                                        } : { width: 1 }
                                ]
                            }
                        ]
                    }
                ],
            }
        }
    }

    show(new_head, search_bar, item) {
        this.$$("new_form").config.search_bar = search_bar;
        if (item) {
            this.p_item = item;
            this.$$("new_form").parse(item);
            this.$$("new_f_right").parse(item);
            this.$$("new_form").config.spr = true;
        }
        if (search_bar.config.localId !== '_sb') {
            this._id_vnd = $$("_suppl").getList().getItem($$("_suppl").getValue()).id_vnd;
            if ((permited_add.users.includes(this.app.config.user) && this._id_vnd == 45835) ||
                permited_add.users.includes(this.app.config.user)) {
                this.$$("_local_id_group").setValue('ZakMedCtg.18');
                // this.$$("_local_id_group").disable();
            }
        }
        this.getRoot().getHead().getChildViews()[0].setValue(new_head);
        this.getRoot().show();

        // if (permited_add.users.includes(this.app.config.user)) {
        //     this.$$("_local_id_group").setValue('ZakMedCtg.18');
        //     this.$$("_local_id_group").disable();
        // }

        // if ((permited_add.users.includes(this.app.config.user) && item.id_group === 'ZakMedCtg.18')
        //     || this.app.config.roles[this.app.config.role].spredit) {
        //     this.savePermitted = true;
        //     this.$$("_save").show();
        // } else {this.savePermitted = false;}

        this.$$("inputTxt").focus();
    }
    hide() {
        this.getRoot().hide()
    }
    init() {
        this.popstri = this.ui(NewstriView);
        this.popbar = this.ui(NewbarView);
        this.poptg = this.ui(NewtgView);
        this.popis = this.ui(NewIssueView);
    }
}


