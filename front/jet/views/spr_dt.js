"use strict";

/*
сниппет
webix.ui({ 
  view:"datatable",
  subview:{
    borderless:true,
    view:"form",
    elements:[
      { view:"text", name:"title", label:"Title"},
      { view:"text", name:"year", label:"Year"},
      { cols:[
        { }, { view:"button", value:"Save", click:function(){
          var form = this.getFormView();
          var values = form.getValues();
          var changed = form.getDirtyValues();
          var master = form.getMasterView();
          
          master.updateItem(values.id, changed);
          master.closeSub(values.id)
        }}
      ]}
    ]
  },
  on:{
    onItemDblClick: function(id) {
        this.openSub(id);
        },
    onSubViewCreate:function(view, item){
      view.setValues(item);
    }
  },
  columns:[
    { id:"title",   header:"Title", sort:"string",
     template:"{common.subrow()} #title#", fillspace:true },
    { id:"year",    header:"Year",      width:100, sort:"int"},
    { id:"votes",   header:"Votes",     width:100,  sort:"int"}
  ],
  autoheight:true,
  data:[
    { id:1, title:"The Shawshank Redemption", year:1994, votes:678790 },
    { id:2, title:"The Godfather", year:1972, votes:511495 },
    { id:3, title:"The Godfather: Part II", year:1974, votes:319352 }
  ]
});


*/


import {JetView} from "webix-jet";
import NewformView from "../views/new_form";
import {get_spr, fRefresh, fRender, checkKey, compareTrue, checkVal, request} from "../views/globals";
import PagerView from "../views/pager_view";
import SideFormView from "../views/side_form";
import SubRow from "../views/sub_row";

export default class SprView extends JetView{
    config(){
        var app = this.app;
        
        var filtFunc = () => {
            let old_v = this.getRoot().getChildViews()[1].$scope.$$("__page").getValue();
            this.getRoot().getChildViews()[1].$scope.$$("__page").setValue((+old_v ===0) ? '1' : "0");
            this.getRoot().getChildViews()[1].$scope.$$("__page").refresh();
            }

        let url = app.config.r_url + "?getDvAll";
        let params = {"user": app.config.user};
        let res = checkVal(request(url, params, !0).response, 's');
        var dvList = []
        if (res) {
            res.forEach(function(it, i, res) {
                let tt = {'id': it.id, 'value': it.act_ingr};
                dvList.push(tt);
                });
            };

        var sprv = {view: "datatable",
            name: "__dt",
            localId: "__table",
            navigation: "row",
            select: true,
            resizeColumn:true,
            fixedRowHeight:false,
            rowLineHeight:30,
            rowHeight:30,
            editable: false,
            //footer: true,
            headermenu:{
                autowidth: true, 
                },
            startPos: 1,
            posPpage: app.config.posPpage,
            totalPos: 0,
            fi: 'c_tovar',
            di: 'asc',
            old_stri: "",
            searchBar: "_spr_search",
            searchMethod: "getSprSearch",
            subview: (obj, target) => {
                let item = this.$$("__table").getItem(obj.id);
                item = item.id_spr;
                item = get_spr(this, item);
                item["id"] = obj.id;
                item["s_name"] = "Страна: " + item.c_strana;
                item["t_name"] = "Название товара: " + item.c_tovar;
                item["v_name"] = "Производитель: " + item.c_zavod;
                item["dv_name"] = "Д. вещество: " + item.c_dv;
                var sub = new SubRow(this.app, {
                    pager: this.$$("__table").getParentView().getChildViews()[1].$scope.$$("__page"),
                    dt: this.$$("__table"),
                    item: item,
                    header: "<span style='color: red; text-transform: uppercase;'>Редактирование записи </span>" + item.id_spr,
                    search_bar: $$("_spr_search")
                    });
                this.ui(sub, { container: target });
                return sub.getRoot();
                },
            columns: [
                {id: "id_mnn", width: 75,
                    template: function (obj) {
                        //let ret = (+obj.id_dv !== 0) ? "<div> <span style='color: green'>есть</span></div>" : "<div> <span style='color: red'>нет</span></div>";
                        //return ret
                        return (+obj.id_dv !== 0) ? "<span class='webix_icon fa-check-circle', style='color: green'></span>" :
                                                    "<span class='webix_icon fa-times-circle', style='color: red'></span>";
                        },
                    css: "center_p",
                    header: [{text: "МНН"},
                        ],
                    },
                {id: "id_spr", width: 80, sort: "server",
                    header: [{text: "IDSPR"},
                        {content:"cFilt"}
                        ],
                    headermenu:false,
                    },
                { id: "c_tovar", fillspace: 1, sort: "server",
                    header: [{text: "Название"},
                        ],
                    headermenu:false,
                    },
                { id: "id_zavod", sort: "server",
                    width: 300,
                    header: [{text: "Производитель"},
                        ]
                    },
                { id: "id_strana", //sort: "text",
                    width: 200,
                    header: [{text: "Страна"},
                        ]
                    },
                { id: "c_dv", hidden: true,
                    width: 300,
                    header: [{text: "Д. в-во"},
                        {content: "mycomboFilter", compare: compareTrue,
                            inputConfig : {
                                options: dvList
                                },
                            }
                        ]
                    },
                { id: "c_group", hidden: true,
                    width: 150,
                    header: [{text: "Группа"},
                        ]
                    },
                { id: "c_nds", hidden: true,
                    width: 150,
                    header: [{text: "НДС"},
                        ]
                    },
                { id: "c_hran", hidden: true,
                    width: 150,
                    header: [{text: "Условия хранения"},
                        ]
                    },
                { id: "c_sezon", hidden: true,
                    width: 150,
                    header: [{text: "Сезонность"},
                        ]
                    },
                {id: "mandat", width:100,
                    template: function (obj) {
                        let ret = (obj.c_mandat) ? "<div><span class='webix_icon fa-check-circle'></span></div>"
                                                 : "<div><span></span></div>";
                        return ret
                        },
                    hidden: true, css: "center_p",
                    header: [{text: "Обязательный"},
                        ],
                    },
                {id: "prescr", width:100,
                    template: function (obj) {
                        let ret = (obj.c_prescr) ? "<div><span class='webix_icon fa-check-circle'></span></div>"
                                                 : "<div><span></span></div>";
                        return ret
                        },
                    hidden: true, css: "center_p",
                    header: [{text: "Рецептурный"},
                        ],
                    },
                ],
            on: {
                "data->onParse":function(i, data){
                    let side_but = this.$scope.getRoot().getParentView().$scope.$$("sideButton");
                    if (side_but.config.formOpen) {
                        let item = {}
                        item["s_name"] = "Страна: ";
                        item["t_name"] = "Название товара: ";
                        item["v_name"] = "Производитель: ";
                        item["dv_name"] = "Д. вещество: ";
                        this.$scope.getParentView().sideForm.parse_f('', $$("_spr_search"), item);
                        }
                    this.clearAll();
                    $$("_link").hide();
                    
                    },
                onBeforeSort: (field, direction) => {
                    this.$$("__table").config.fi = field;
                    this.$$("__table").config.di = direction;
                    let old_v = this.getRoot().getChildViews()[1].$scope.$$("__page").getValue();
                    this.getRoot().getChildViews()[1].$scope.$$("__page").setValue((+old_v ===0) ? '1' : "0");
                    this.getRoot().getChildViews()[1].$scope.$$("__page").refresh();
                    //filtFunc();
                    },
                onBeforeRender: function() {
                    webix.extend(this, webix.ProgressBar);
                    },
                onSubViewClose: function(id) {
                    delete this.getItem(id)["$subContent"]
                    delete this.getItem(id)["$subHeight"]
                    delete this.getItem(id)["$subOpen"]
                    },
                onItemDblClick: function(item) {
                    let side_but = this.$scope.getRoot().getParentView().$scope.$$("sideButton");
                    let row_id = this.getSelectedId();
                    this.openSub(row_id);
                    return
                    if (!side_but.config.formOpen) {
                        item = this.getSelectedItem();
                        item = item.id_spr;
                        item = get_spr(this.$scope, item);
                        item["s_name"] = "Страна: " + item.c_strana;
                        item["t_name"] = "Название товара: " + item.c_tovar;
                        item["v_name"] = "Производитель: " + item.c_zavod;
                        item["dv_name"] = "Д. вещество: " + item.c_dv;
                        this.$scope.popnew.show("Редактирование записи " + item.id_spr, $$("_spr_search"), item);
                        };
                    },
                onAfterLoad: function() {
                    this.hideProgress();
                    },
                onAfterSelect: function() {
                    let side_but = this.$scope.getRoot().getParentView().$scope.$$("sideButton");
                    if (side_but.config.formOpen) {
                        let item = this.$scope.$$("__table").getSelectedItem();
                        item = item.id_spr;
                        item = get_spr(this.$scope, item);
                        item["s_name"] = "Страна: " + item.c_strana;
                        item["t_name"] = "Название товара: " + item.c_tovar;
                        item["v_name"] = "Производитель: " + item.c_zavod;
                        item["dv_name"] = "Д. вещество: " + item.c_dv;
                        this.$scope.getParentView().sideForm.parse_f("Просмотр записи <span style='color: red'>" + item.id_spr + "</span>.  Изменения не будут сохранены", $$("_spr_search"), item);
                        }
                    if ($$("prcs_dc").count() > 0) {
                        $$("_link").show();
                        }
                    },
                onKeyPress: function(code, e){
                    if (13 === code) {
                        this.callEvent("onItemDblClick");
                        }
                    },
                }
            }
        var dt = {
            view: "layout",
            rows: [
                sprv,
                {$subview: PagerView},
                ]}

        return dt
        }

    init() {
        this.popnew = this.ui(NewformView);
        }
    }
