//"use strict";

import {JetView} from "webix-jet";
import {strana, vendor, dv, sezon, nds, group, hran} from "../views/globals";
import {request, checkVal, prcs, delPrc, barcodes} from "../views/globals";

export default class SideFormView extends JetView{
    config(){
        let app = this.app;
        function strana_filter(item, value) {
            value = value.toString().toLowerCase()
            value = new RegExp(".*" + value.replace(/ /g, ".*") + ".*");
            return item.c_strana.toString().toLowerCase().search(value) != -1;
            };
        function zavod_filter(item, value) {
            value = value.toString().toLowerCase()
            return item.c_zavod.toString().toLowerCase().search(value) != -1;
            };
        function dv_filter(item, value) {
            value = value.toString().toLowerCase()
            value = new RegExp(".*" + value.replace(/ /g, ".*") + ".*");
            return item.act_ingr.toString().toLowerCase().search(value) != -1;
            };
        function gr_filter(item, value) {
            value = value.toString().toLowerCase()
            value = new RegExp(".*" + value.replace(/ /g, ".*") + ".*");
            return item.group.toString().toLowerCase().search(value) != -1;
            };
        function sez_filter(item, value) {
            value = value.toString().toLowerCase()
            value = new RegExp(".*" + value.replace(/ /g, ".*") + ".*");
            return item.sezon.toString().toLowerCase().search(value) != -1;
            };
        function hran_filter(item, value) {
            value = value.toString().toLowerCase()
            value = new RegExp(".*" + value.replace(/ /g, ".*") + ".*");
            return item.usloviya.toString().toLowerCase().search(value) != -1;
            };

        function check(item){
            if (item) {
                if (item.toString().length > 0 ) return true
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

        var m_body = { view: "form",
            localId: "new_form",
            readonly: true,
            margin: 0,
            spr: false,
            search_bar: undefined,
            rules:{
                "c_tovar": webix.rules.isNotEmpty,
                "id_strana": webix.rules.isNotEmpty,
                "id_zavod": webix.rules.isNotEmpty,
                "id_dv": webix.rules.isNotEmpty
                },
            elements: [
                {view: "label", label: "Просмотр записи", name: "idspr"},
                {rows: [
                    {view: "label", label:"Название товара:", name: 't_name'},
                    {view: "text", label: "", value: "", name: "c_tovar", required: true, css: "raw_text"},
                    {height: 10, width: 700},
                    {cols: [
                        {rows: [
                            {view: "label", label:"Страна:", name: "s_name"},
                            {view:"combo", width: 400, value: "", name: 'id_strana', required: true,
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
                            {view: "label", label:"Производитель:", name: "v_name"},
                            {view:"combo", label: "", value: "", name: "id_zavod", required: true,
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
                            {view: "label", label:"Д. вещество:", name: 'dv_name'},
                            {view:"combo", label: "", value: "", name: "id_dv", required: true,
                                options:  {
                                    filter: dv_filter,
                                    body: {
                                        autoheight:false,
                                        view:"list",
                                        type:{ height:"auto" },
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
                            {view: "label", label:"Форма выпуска:"},
                            {view:"text", label: "", value: "", labelPosition:"left", readonly: true, name: "issue", localId: "_issue", css: "raw_text",
                                readonly: true,
                                },
                            {view:"text", label: "Штрих-код:", value: "", labelPosition:"top", readonly: true, name: "barcode", localId: "_barc", css: "raw_text",
                                readonly: true,
                                },
                            {view: "text", label: "Товарная группа:", labelPosition:"top", value: "", name: "c_tgroup", localId: "_c_tgroup",  css: "raw_text",
                                readonly: true,
                                }
                            ]},
                        {width: 5,},
                        {rows: [
                            {view: "form", css: "borders",
                                localId: "new_f_right",
                                elements: [
                                    {height: 5},
                                    {cols: [
                                        {view: "checkbox", labelRight: "Рецептурный", labelWidth: 0, align: "left", name: "_prescr"},
                                        {view: "checkbox", labelRight: "Обязательный", labelWidth: 0, align: "left", name: "_mandat"},
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
                                            onAfterRender: function() {
                                                this.getList().sync(group);
                                                }
                                            },
                                        },
                                    {view:"combo", label: "НДС:", labelPosition:"top", value: "", name: "id_nds", css: "small",
                                        options:  {
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
                                ]}
                            ]}
                        ]},
                    {cols: [
                        {view: "button", type: "base", label: "Отменить", width: 120, height: 32, hidden: true,
                            click: () => {
                                this.hide();
                                }
                            },
                        {hidden: true},
                        {view: "button", type: "base", label: "Сохранить", width: 120, height: 32, 
                        //hidden: !app.config.roles[app.config.role].spredit, 
                        hidden: true,
                            click: () => {
                                let valid = this.$$("new_form").validate({hidden:false, disabled:false});
                                if (valid) {
                                    let left_f = this.$$("new_form").getValues();
                                    let right_f = this.$$("new_f_right").getValues();
                                    let params = {};
                                    params["id_spr"] = (left_f.id_spr) ? left_f.id_spr : -1;
                                    params["barcode"] = left_f.barcode;
                                    params["c_tovar"] = left_f.c_tovar;
                                    params["id_strana"] = left_f.id_strana;
                                    params["id_zavod"] = left_f.id_zavod;
                                    params["id_dv"] = left_f.id_dv;
                                    params["c_opisanie"] = left_f.c_opisanie;
                                    params["prescr"] = (right_f._prescr ===  1) ? true : false;
                                    params["mandat"] = (right_f._mandat ===  1) ? true : false;
                                    params["id_sezon"] = right_f.id_sezon;
                                    params["id_usloviya"] = right_f.id_usloviya;
                                    params["id_group"] = right_f.id_group;
                                    params["id_nds"] = right_f.id_nds;
                                    //params["sh_prc"] = (this.$$("new_form").config.spr) ? prcs.getItem(prcs.getCursor()).sh_prc : undefined;
                                    let t1 = $$("prcs_dc").getCursor();
                                    if (t1 && $$("prcs_dc").getItem(t1).sh_prc) params["sh_prc"] = $$("prcs_dc").getItem(t1).sh_prc || undefined;
                                    else params["sh_prc"] = undefined;
                                    params["c_tgroup"] = left_f.c_tgroup;
                                    params["user"] = this.app.config.user;
                                    let url = this.app.config.r_url + "?setSpr";
                                    let res = request(url, params, !0).response;
                                    res = checkVal(res, 's');
                                    if (res && res.new && this.$$("new_form").config.spr) {
                                        delPrc(params, this);
                                    } else {
                                        this.$$("new_form").config.search_bar.callEvent('onKeyPress', [13,]);
                                        barcodes.clearAll();
                                        this.$$("new_form").clear();
                                        this.$$("new_form").reconstruct();
                                        };
                                    this.$$("new_form").config.spr = false;
                                    };
                                }
                            }
                        ]}
                    ]}
                ],
            }


        return {view: "cWindow",
            //view: "popup",
            localId: "sw",
            relative: true,
            animate: true,
            head: false,
            resize: !true,
            modal: !true,
            // position: function (state) {
            //     state.left = innerWidth - 724; // fixed values
            //     state.top = 226;
            //     //state.width -=innerWidth/2; // relative values
            //     //state.height +=60;
            //     },
            on: {
                onHide: function() {
                    barcodes.clearAll();
                    this.$scope.$$("new_form").clear();
                    this.$scope.$$("new_form").reconstruct();
                    }
                },
            body: m_body,
            }
        }

    parse_f(new_head, search_bar, item){
        this.$$("new_form").config.search_bar = search_bar;
        if (item) {
            item["idspr"] = new_head;
            this.$$("new_form").parse(item);
            //this.$$("new_f_right").parse(item);
            this.$$("new_form").config.spr = true;
            }
        }
        
    show_f(parent, search_bar, item){
        this.$$("new_form").config.search_bar = search_bar;
        if (item) {
            this.$$("new_form").parse(item);
            this.$$("new_f_right").parse(item);
            this.$$("new_form").config.spr = true;
            }
        this.getRoot().show(parent)
        }
    hide_f(){
        this.getRoot().hide()
        }
    init() {
        }
    }


