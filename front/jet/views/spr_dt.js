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
import {get_spr} from "../views/globals";
import {get_data} from "../views/globals";
import {last_page, getDtParams} from "../views/globals";
import PagerView from "../views/pager_view";
import SideFormView from "../views/side_form";

export default class SprView extends JetView{
    config(){
        var app = this.app;
        
        var filtFunc = () => {
            let old_v = this.getRoot().getChildViews()[1].$scope.$$("__page").getValue();
            this.getRoot().getChildViews()[1].$scope.$$("__page").setValue((+old_v ===0) ? '1' : "0");
            this.getRoot().getChildViews()[1].$scope.$$("__page").refresh();
            }

        function mnn_func(obj) {
            let ret = (+obj.id_dv !== 0) ? "<div> <span class='green'>есть</span></div>"
                                         : "<div> <span class='red'>нет</span></div>";
            return ret
            }

        function mandat_func(obj) {
            let ret = (obj.c_mandat) ? "<div><span class='webix_icon fa-check-circle'></span></div>"
                                     : "<div><span></span></div>";
            return ret
            }

        function prescr_func(obj) {
            let ret = (obj.c_prescr) ? "<div><span class='webix_icon fa-check-circle'></span></div>"
                                     : "<div><span></span></div>";
            return ret
            }

        var fform = {
            template: "возможно здесь будет карточка товара для редактирования", height: 40
            };

        var sprv = {view: "datatable",
            subview: fform,
            name: "__dt",
            localId: "__table",
            navigation: "row",
            select: true,
            resizeColumn:true,
            fixedRowHeight:false,
            rowLineHeight:32,
            rowHeight:32,
            editable: false,
            //footer: true,
            headermenu:{
                autowidth: true, 
                },
            startPos: 1,
            posPpage: 20,
            totalPos: 0,
            fi: 'c_tovar',
            di: 'asc',
            old_stri: "",
            searchBar: "_spr_search",
            searchMethod: "getSprSearch",
            //css: 'dt_css',
            columns: [
                {id: "id_mnn", width: 75, template: mnn_func,
                    header: [{text: "МНН"},
                        ],
                    //footer: {text:"Всего:", colspan:5, rowspan: 1, height: 24}
                    },
                {id: "id_spr", width: 80, sort: "server",
                    header: [{text: "IDSPR"},
                        //{content:"textFilter"}
                        ],
                    headermenu:false,
                    },
                { id: "c_tovar", fillspace: 1, sort: "server",
                    //template:"{common.subrow()} #c_tovar#",
                    header: [{text: "Название"},
                        //{content:"textFilter"}
                        ],
                    headermenu:false,
                    },
                { id: "id_zavod", sort: "server",
                    width: 300,
                    header: [{text: "Производитель"},
                        //{content:"textFilter"}
                        ]
                    },
                { id: "id_strana", //sort: "text",
                    width: 200,
                    header: [{text: "Страна"},
                        //{content:"textFilter"}
                        ]
                    },
                { id: "c_dv", hidden: true,
                    width: 150,
                    header: [{text: "Д. в-во"},
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
                {id: "mandat", width:100, template: mandat_func, hidden: true, css: "col_center",
                    header: [{text: "Обязательный"},
                        ],
                    },
                {id: "prescr", width:100, template: prescr_func, hidden: true, css: "col_center",
                    header: [{text: "Рецептурный"},
                        ],
                    },
                ],
            on: {
                "data->onParse":function(i, data){
                    this.clearAll();
                    $$("_link").hide();
                    },
                onBeforeSort: (field, direction) => {
                    this.$$("__table").config.fi = field;
                    this.$$("__table").config.di = direction;
                    filtFunc();
                    },
                onBeforeRender: function() {
                    webix.extend(this, webix.ProgressBar);
                    },
                onItemDblClick: function(item) {
                    let side_but = this.$scope.getRoot().getParentView().$scope.$$("sideButton");
                    if (!side_but.config.formOpen) {
                        item = this.getSelectedItem();
                        item = item.id_spr;
                        item = get_spr(this.$scope, item);
                        item["s_name"] = "Страна: " + item.c_strana;
                        item["t_name"] = "Название товара: " + item.c_tovar;
                        item["v_name"] = "Производитель: " + item.c_zavod;
                        item["dv_name"] = "Действующее вещество: " + item.c_dv;
                        this.$scope.popnew.show("Редактирование записи " + item.id_spr, $$("_spr_search"), item);
                    }
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
                        item["dv_name"] = "Действующее вещество: " + item.c_dv;
                        this.$scope.getParentView().sideForm.parse_f("Редактирование записи " + item.id_spr, $$("_spr_search"), item);
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
