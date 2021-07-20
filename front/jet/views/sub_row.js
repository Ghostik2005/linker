//"use strict";

import {JetView} from "webix-jet";
import NewstriView from "../views/new_stri";
import NewbarView from "../views/new_bar";
import NewtgView from "../views/new_tg";
import NewIssueView from "../views/new_issue";
import {strana, vendor, dv, sezon, nds, group, hran, id521} from "../views/globals";
import {request, checkVal, prcs, delPrc, barcodes} from "../views/globals";
import {permited_add} from "../models/variables";
import {strana_filter, zavod_filter, dv_filter, gr_filter, sez_filter, hran_filter, nds_filter, id521_filter} from "../views/globals";

export default class SubRow extends JetView{
    constructor(app, data){
        super(app);
        this.customData = data;
        }

    config(){
        let th = this;
        let app = this.app;

        function addZavod(item) {
            vendor.add(item, 0);
            }
        function addDv(item) {
            dv.add(item, 0);
            }

        var m_body = { view: "form",
            css: "no_border",
            localId: "new_form",
            margin: 0,
            spr: false,
            search_bar: undefined,
            rules:{
                "c_tovar": webix.rules.isNotEmpty,
                "id_strana": webix.rules.isNotEmpty,
                "id_zavod": webix.rules.isNotEmpty,
                "id_dv": webix.rules.isNotEmpty,
                "id_group": webix.rules.isNotEmpty,
                },
            on: {
                onViewShow: () => {

                }
            },
            elements: [
                {view: "label", label: "", name: "idspr", css: {"margin-top": "0px !important"}},
                {rows: [
                    {view: "label", label:"Название товара:", name: 't_name'},
                    {view: "text", label: "", value: "", name: "c_tovar", required: true, css: "raw_text"},
                    {height: 10, width: 1050},
                    {cols: [
                        {rows: [
                            {cols: [
                                {rows: [
                                    {view: "label", label:"Страна:", name: "s_name"},
                                    {view:"combo", width: 350, value: "", name: 'id_strana', required: true,
                                        options:  {
                                            filter: strana_filter,
                                            body: {
                                                template:"#c_strana#",
                                                yCount:7,
                                                //data: strana
                                                }
                                            },
                                        on: {
                                            onAfterRender: function() {
                                                this.getList().sync(strana);
                                                }
                                            },
                                        },
                                    ]},
                                {rows: [
                                    {view: "label", label:"Производитель:", name: "v_name"},
                                    {cols: [
                                        {view:"combo", width: 320, label: "", value: "", name: "id_zavod", required: true,
                                            options:  {
                                                filter: zavod_filter,
                                                body: {
                                                    template:"#c_zavod#",
                                                    yCount:7,
                                                    //data: vendor
                                                    }
                                                },
                                            on: {
                                                onAfterRender: function() {
                                                    this.getList().sync(vendor);
                                                    }
                                                },
                                            },
                                        {view: "button", type: "base", label: "+", width: 30, hidden: !app.config.roles[app.config.role].vendoradd,
                                            click: () => {
                                                let params = {'new_name': 'c_zavod', 'url': "Zavod", "callback": addZavod}
                                                this.popstri.show("Добавление производителя", params);
                                                }
                                            },
                                        ]},
                                    ]},
                                ]},
                            {cols: [
                                {rows: [
                                    {view: "label", label:"Д. вещество:", name: 'dv_name'},
                                    {cols: [
                                        {view:"combo", label: "", value: "", name: "id_dv", required: true,
                                            options:  {
                                                filter: dv_filter,
                                                body: {
                                                    autoheight:false,
                                                    view:"list",
                                                    type:{ height:"auto", width: "auto" },
                                                    template: "<div class='comboList'>#act_ingr#</div>",
                                                    height: 200,
                                                    yCount:0,
                                                    //data: dv
                                                    }
                                                },
                                            on: {
                                                onAfterRender: function() {
                                                    this.getList().sync(dv);
                                                    }
                                                },
                                            },
                                        {view: "button", type: "base", label: "+", width: 30, hidden: !app.config.roles[app.config.role].vendoradd,
                                            click: () => {
                                                let params = {'new_name': 'act_ingr', 'url': "Dv1", "callback": addDv}
                                                this.popstri.show("Добавление д.вещества", params);
                                                }
                                            },
                                        ]},
                                    ]},
                                {rows: [
                                    {view: "label", label:"Форма выпуска:"},
                                    {view:"text", label: "", value: "", labelPosition:"left", readonly: true, name: "issue", localId: "_issue", css: "raw_text",
                                        readonly: true,
                                        click: () => {
                                            let id_spr = this.$$("new_form").getValues().id_spr;
                                            this.popis.show("Редактирование форм выпуска", id_spr, this);
                                            }
                                        },
                                    ]},
                                ]},
                            {rows: [
                                {view: "label", label:"Штрих-код:"},
                                {view:"text", label: "", value: "", labelPosition:"left", readonly: true, name: "barcode", localId: "_barc", css: "raw_text",
                                    readonly: true,
                                    click: () => {
                                        let id_spr = this.$$("new_form").getValues().id_spr;
                                        this.popbar.show("Редактирование ш.кодов", id_spr, this);
                                        }
                                    },
                                ]},
                            {rows: [
                                {view: "label", label:"Товарная группа:"},
                                {view: "text", label: "", labelPosition:"left", value: "", name: "c_tgroup", localId: "_c_tgroup",  css: "raw_text",
                                    readonly: true,
                                    click: () => {
                                        let id_spr = this.$$("new_form").getValues().id_spr;
                                        this.poptg.show("Редактирование товарных групп", id_spr, this);
                                        }
                                    },
                                ]},
                            ]},
                        {width: 5,},
                        {width: 400, rows: [
                            {//view: "form",

                                type: "form",
                                css: "borders",
                                localId: "new_f_right",
                                rows: [
                                //elements: [
                                    //{height: 25},
                                    {css: {"margin-top": "0px !important;"}, cols: [
                                        {view: "checkbox", labelRight: "Рецептурный", labelWidth: 0, align: "left", name: "_prescr"},
                                        {view: "checkbox", labelRight: "Обязательный", labelWidth: 0, align: "left", name: "_mandat"},
                                        {view: "checkbox", labelRight: "ЖВ", labelWidth: 0, align: "left", name: "id_jv"},
                                        ]},
                                    {view:"combo", label: "Сезон:", labelPosition:"top", value: "", name: "id_sezon", css: "small",
                                        options:  {
                                            filter: sez_filter,
                                            body: {
                                                //autoheight:false,
                                                //view:"list",
                                                //type:{ height:"auto" },
                                                template: "#sezon#",
                                                //height: 400,
                                                yCount:5,
                                                //data: sezon
                                                }
                                            },
                                        on: {
                                            onAfterRender: function() {
                                                this.getList().sync(sezon);
                                                }
                                            },
                                        },
                                    {view:"combo", label: "Условия хранения:", labelPosition:"top", value: "", name: "id_usloviya", css: "small",
                                        options:  {
                                            filter: hran_filter,
                                            body: {
                                                //autoheight:false,
                                                //view:"list",
                                                //type:{ height:"auto" },
                                                template: "#usloviya#",
                                                //height: 400,
                                                yCount:5,
                                                //data: hran
                                                }
                                            },
                                        on: {
                                            onAfterRender: function() {
                                                this.getList().sync(hran);
                                                }
                                            },
                                        },
                                    {view:"combo", label: "Группа:", labelPosition:"top", value: "", name: "id_group", css: "small",
                                        localId: '_local_id_group',
                                        required:true,
                                        options:  {
                                            filter: gr_filter,
                                            body: {
                                                autoheight:false,
                                                view:"list",
                                                type:{ height:"auto" },
                                                template: "<div class='comboList'>#group#</div>",
                                                height: 200,
                                                yCount:0,
                                                //data: group
                                                }
                                            },
                                        on: {
                                            onChange: function(new_val) {
                                                let item = this.getValue();
                                                console.log('i1', item);
                                                this.$scope.savePermitted = true;
                                                this.$scope.$$("_save").show();
                                                let nds_c = this.$scope.$$('__nds');
                                                if (new_val == 'ZakMedCtg.1114') {
                                                    nds_c.setValue("ZakMedCtg.1358")
                                                }
                                            },
                                            onAfterRender: function() {
                                                // console.log('vnd', this.$scope._id_vnd);
                                                // console.log('ii', this.$scope.customData.item.id_group);
                                                // console.log('u', this.$scope.app.config.user);
                                                if (['antey1', 'antey2'].includes(this.$scope.app.config.user) && !this.$scope.customData.item.id_group) {
                                                    this.getList().parse(group);
                                                } else if (['antey1', 'antey2'].includes(this.$scope.app.config.user) && this.$scope.customData.item.id_group === "ZakMedCtg.1115") {
                                                    this.getList().parse([{id: 'ZakMedCtg.1115', group: "Изделия медицинского назначения"},])
                                                } else if (permited_add.users.includes(this.$scope.app.config.user)  && this.$scope._id_vnd == 51066) {
                                                    group.serialize().forEach((it) => {
                                                        if (it.id != 'ZakMedCtg.1114') {
                                                            this.getList().add(it)
                                                        }
                                                    })
                                                } else if  ((permited_add.users.includes(this.$scope.app.config.user) && this.$scope._id_vnd == 45835) ||
                                                            (permited_add.users.includes(this.$scope.app.config.user) )){
                                                    this.getList().parse([{id: 'ZakMedCtg.18', group: "Товары для животных"},]);
                                                    this.getList().parse([{id: 'ZakMedCtg.1115', group: "Изделия медицинского назначения"},]);
                                                    this.getList().parse([{id: 'OR', group: "Ортопедия и средства реабилитации"},]);
                                                    this.getList().parse([{id: 'Z', group: "Парфюмерия/косметика/средства личной гигиены"},]);
                                                    this.getList().parse([{id: 'ZakMedCtg.17', group: "Медицинские приборы и оборудование"},]);
                                                    this.getList().parse([{id: 'Д', group: "Товары для детей"},]);
                                                } else {
                                                    this.getList().parse(group);
                                                }

                                                // if (this.$scope.savePermitted) {
                                                //     this.getList().add({id: 'ZakMedCtg.18', group: "Товары для животных"})
                                                // } else {
                                                //     this.getList().parse(group);
                                                // }
                                                // this.getList().sync(group);
                                                }
                                            },
                                        },
                                    {view:"combo", label: "НДС:", labelPosition:"top", value: "", name: "id_nds", css: "small",
                                        localId: '__nds',
                                        options:  {
                                            filter: nds_filter,
                                            body: {
                                                template:"#nds#",
                                                yCount:5,
                                                //data: nds
                                            }
                                        },
                                        on: {
                                            onAfterRender: function() {
                                                this.getList().sync(nds);
                                            }
                                        },
                                    },
                                    {view:"combo", label: "Код ном.:", labelPosition:"top", value: "", name: "id_521", css: "small",
                                        localId: "__id_521",
                                        options:  {
                                            tooltip: true,
                                            filter: id521_filter,
                                            body: {
                                                template:"#id_521#",
                                                tooltip: "#id_521#",
                                                yCount:5,
                                            }
                                        },
                                        on: {
                                            onAfterRender: function() {
                                                this.getList().sync(id521);
                                            }
                                        },
                                    },

                                ]}
                            ]}
                        ]},
                    {cols: [
                        {view: "button", type: "base", label: "Отменить", width: 120, height: 32, hidden: !true,
                            click: () => {
                                this.customData.dt.closeSub(this.customData.item.id);
                                //console.log('focus', this.customData.focus);
                                //this.customData.focus.focus();
                                }
                            },
                        {},
                        {view: "button", type: "base", label: "Сохранить", width: 120, height: 32,
                        hidden: !th.savePermitted,
                        localId: '_save',
                        // hidden: !(app.config.roles[app.config.role].spredit || permited_add.users.includes(app.config.user)),
                            click: () => {
                                let valid = this.$$("new_form").validate({hidden:false, disabled:false});
                                if (valid) {
                                    let left_f = this.$$("new_form").getValues();
                                    let params = {};
                                    params["id_spr"] = (left_f.id_spr) ? left_f.id_spr : -1;
                                    params["barcode"] = left_f.barcode;
                                    params["issue"] = left_f.issue;
                                    params["c_tovar"] = left_f.c_tovar;
                                    params["id_strana"] = left_f.id_strana;
                                    params["id_zavod"] = left_f.id_zavod;
                                    params["id_dv"] = left_f.id_dv;
                                    params["c_opisanie"] = left_f.c_opisanie;
                                    params["prescr"] = (left_f._prescr ===  1) ? true : false;
                                    params["mandat"] = (left_f._mandat ===  1) ? true : false;
                                    params["id_jv"] = (left_f.id_jv ===  1) ? true : false;
                                    params["id_sezon"] = left_f.id_sezon;
                                    params["id_usloviya"] = left_f.id_usloviya;
                                    params["id_group"] = left_f.id_group;
                                    params["id_nds"] = left_f.id_nds;
                                    //params["sh_prc"] = (this.$$("new_form").config.spr) ? prcs.getItem(prcs.getCursor()).sh_prc : undefined;
                                    // let t1 = $$("prcs_dc").getCursor();
                                    // if (t1 && $$("prcs_dc").getItem(t1).sh_prc) params["sh_prc"] = $$("prcs_dc").getItem(t1).sh_prc || undefined;
                                    // else params["sh_prc"] = undefined;
                                    params["sh_prc"] = undefined;
                                    params["c_tgroup"] = left_f.c_tgroup;
                                    params["user"] = this.app.config.user;
                                    params["id_521"] = this.$$("__id_521").getText();
                                    let url = this.app.config.r_url + "?setSpr";
                                    let res = request(url, params, !0).response;
                                    res = checkVal(res, 's');
                                    if (res && res.new && this.$$("new_form").config.spr) {
                                        delPrc(params, this);
                                    } else {
                                        //console.log('dt', this.$$("new_form").config.dt);
                                        let page = +this.$$("new_form").config.pag.getValue();
                                        this.$$("new_form").config.pag.callEvent("onChange", [page, page+1])
                                        //this.$$("new_form").config.search_bar.callEvent('onKeyPress', [13,]);
                                        barcodes.clearAll();
                                        this.$$("new_form").clear();
                                        this.$$("new_form").reconstruct();
                                        };
                                    this.$$("new_form").config.spr = false;
                                    //this.customData.dt.closeSub(this.customData.item.id);
                                    this.customData.dt.focusEditor();
                                    };
                                }
                            }
                        ]}
                    ]}
                ],
            }

        return {cols: [
            {width: 160},
            m_body
            ]}
        }



    ready(view) {
        this.$$("new_form").config.search_bar = this.customData.search_bar;
        this.$$("new_form").config.dt = this.customData.dt;
        this.$$("new_form").config.pag = this.customData.pager;
        let item = this.customData.item;

        let new_head = this.customData.header;
        if (item) {
            if (new_head) {
                item["idspr"] = new_head;
                }
            this.$$("new_form").parse(item);
            console.log('item', item);
            //this.$$("new_f_right").parse(item);
            this.$$("new_form").config.spr = true;
        }
        // if (permited_add.users.includes(this.app.config.user)) {
            // this.$$("_local_id_group").setValue('ZakMedCtg.18');
            // this.$$("_local_id_group").disable();
        // }
        if ((permited_add.users.includes(this.app.config.user) && item.id_group == 'ZakMedCtg.18')
            || ( ['antey1', 'antey2'].includes(this.app.config.user) && !this.customData.item.id_group)
            || this.app.config.roles[this.app.config.role].spredit || item.id_group === "ZakMedCtg.1115") {
            this.savePermitted = true;
            this.$$("_save").show();
        } //else {this.savePermitted = false;}


    }

    init() {
        this.popstri = this.ui(NewstriView);
        this.popbar = this.ui(NewbarView);
        this.poptg = this.ui(NewtgView);
        this.popis = this.ui(NewIssueView);
        }
    }


