//"use strict";

import {JetView} from "webix-jet";
import {prcs} from "../views/globals";
import {get_data} from "../views/globals";

export default class LinksView extends JetView{
    config(){
        function linksTempl(obj, common, value) {
            let ni = "<div>" + obj.c_tovar ;//+ "</div>";
            ni = (obj.c_zavod_s) ? ni   + "<br>" + obj.c_zavod_s + "</div>" : ni  + "</div>";
            let ret = common.treetable(obj, common) + ni;
            console.log(ret);
            return ret
            }
            
        return {view: "cWindow",
            width: document.documentElement.clientWidth * 0.8,
            height: document.documentElement.clientHeight * 0.8,
            modal: true,
            on: {
                onShow: () => {
                    
                        get_data({
                            th: this,
                            view: "__tt",
                            navBar: "__nav_l",
                            start: 1,
                            count: 20,
                            searchBar: "_link_search",
                            method: "getSprLnks"
                            });
                    },
                },
            body: { view: "form",
                margin: 0,
                elements: [
                    { view: "form",
                        margin: 0,
                        elements: [
                            {rows: [
                                {cols: [
                                    {view: "text", label: "", placeholder: "Строка поиска", width: 500, id: "_link_search"},
                                    {view: "checkbox", labelRight: "Поиск по словарю", labelWidth: 0},
                                    {view:"button", type: 'htmlbutton',
                                        label: "<span class='webix_icon fa-unlink'></span><span style='line-height: 20px;'>  Разорвать (Ctrl+D)</span>", width: 220},
                                    ]},
                                {height: 10, width: 900},
                                {view: "treetable",
                                    id: "__tt",
                                    scheme:{
                                        //$group:"name"
                                        },
                                    height: 550,
                                    footer: true,
                                    borderless: true,
                                    columns: [
                                        {id: "c_tovar", header: "Наименование" , fillspace: true,
                                            template: linksTempl
                                            },
                                        {id: "c_zavod", header: "Производитель", width: 200},
                                        {id: "c_vnd", header: "Поставщик", width: 150},
                                        {id: "id_tovar", header: "Код", width: 75},
                                        {id: "dt", header: "Дата", width: 75},
                                        {id: "owner", header: "Создал", width: 100}
                                        ],
                                    select: true,
                                    on: {
                                        onBeforeRender: function() {
                                            webix.extend(this, webix.ProgressBar);
                                            if (!this.count) {
                                                this.showProgress({
                                                    type: "icon",
                                                    icon: '<i class="fa fa-spinner fa-spin fa-3x fa-fw"></i>'
                                                    });
                                                }
                                            },
                                        onBeforeSelect: function (item) {
                                            },
                                        onAfterSelect: function () {
                                            }
                                        },
                                    //data: [
                                        //{id: "1", name: "12345, Наименование препарата 1", sprvendor: "Производитель 1, Китай", data: [
                                            //{id: "1.1", name: "Наименование поставщика 1", vendor: "Производитель 1", supplier: "Поставщик 1", code: "5588445", date: "12.12.2017", creater: "Пользователь"},
                                            //{id: "1.2", name: "Наименование поставщика 2", vendor: "Производ 2", supplier: "Поставщик 1", code: "558812", date: "12.12.2017", creater: "Пользователь"}
                                            //]},
                                        //]
                                    },
                                {cols: [
                                    {},
                                    {view: "button", type: "base", label: "Закрыть", width: 120, height: 32,
                                        click: () => {
                                            webix.message("Закрываем форму");
                                            this.hide();
                                            }
                                        }
                                    ]}
                                ]}
                            ],
                        },
                    {view: "toolbar",
                        id: "__nav_l",
                        height: 36,
                        cols: [
                            {view: "button", type: 'htmlbutton',
                                label: "<span class='webix_icon fa-angle-double-left'></span>", width: 50,
                                click: () => {
                                    //let start = 1;
                                    //let count = $$("__dt").config.posPpage;
                                    //get_data({
                                        //th: this,
                                        //view: "__dt",
                                        //navBar: "__nav",
                                        //start: start,
                                        //count: count,
                                        //searchBar: "_spr_search",
                                        //method: "getSprSearch"
                                        //});
                                    }
                                },
                            {view: "button", type: 'htmlbutton',
                                label: "<span class='webix_icon fa-angle-left'></span>", width: 50,
                                click: () => {
                                    //let th = this;
                                    //let start = $$("__dt").config.startPos - $$("__dt").config.posPpage;
                                    //start = (start < 0) ? 1 : start;
                                    //let count = $$("__dt").config.posPpage;
                                    //get_data({
                                        //th: this,
                                        //view: "__dt",
                                        //navBar: "__nav",
                                        //start: start,
                                        //count: count,
                                        //searchBar: "_spr_search",
                                        //method: "getSprSearch"
                                        //});
                                    }
                                },
                            {view: "label", label: "Страница 1 из 1", width: 200},
                            {view: "button", type: 'htmlbutton',
                                label: "<span class='webix_icon fa-angle-right'></span>", width: 50,
                                click: () => {
                                    //let th = this;
                                    //let start = $$("__dt").config.startPos + $$("__dt").config.posPpage;
                                    //start = (start > $$("__dt").config.totalPos) ? last_page("__dt"): start;
                                    //let count = $$("__dt").config.posPpage;
                                    //get_data({
                                        //th: this,
                                        //view: "__dt",
                                        //navBar: "__nav",
                                        //start: start,
                                        //count: count,
                                        //searchBar: "_spr_search",
                                        //method: "getSprSearch"
                                        //});
                                    }
                                },
                            {view: "button", type: 'htmlbutton',
                                label: "<span class='webix_icon fa-angle-double-right'></span>", width: 50,
                                click: () => {
                                    //let th = this;
                                    //let start = last_page("__dt");
                                    //let count = $$("__dt").config.posPpage;
                                    //get_data({
                                        //th: this,
                                        //view: "__dt",
                                        //navBar: "__nav",
                                        //start: start,
                                        //count: count,
                                        //searchBar: "_spr_search",
                                        //method: "getSprSearch"
                                        //});
                                    }
                                },
                            //{view: "button", type: 'htmlbutton',
                                //label: "<span class='webix_icon fa-refresh'></span>", width: 50
                                //},
                            {},
                            {view: "label", label: "Всего записей: 0", width: 180},
                            ]
                        },
                    ]
                }
            }
        }
        
    show(new_head){
        this.getRoot().getHead().getChildViews()[0].setValue(new_head);
        this.getRoot().show()
        }
    hide(){
        this.getRoot().hide()
        }
    }


