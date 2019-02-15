"use strict";

import {JetView} from "webix-jet";
import NewformView from "../views/new_form";
import History from "../views/history";
import {get_spr, recalcRows, fillFilterOptions, addScrollTooltip, getPNumber} from "../views/globals";
import {DelEdIcons, checkKey, setButtons, dt_formating_sec, dt_formating, setApplyButton} from "../views/globals";
import {refTemplate, toolTipAssign} from "../views/globals";
import {compareTrue, save_storage, del_storage} from "../views/globals";
import PagerView from "../views/pager_view";
import SubRow from "../views/sub_row";
import RelinkFormView from "../views/relink_form";
import PropSelectView from "../views/prop-select-view";
import RlsLinkFormView from "../views/rls_link";

export default class SprView extends JetView{
    config(){
        let app = this.app;
        var vi = this;
        this.options = fillFilterOptions(app);

        var sprv = {view: "datatable",
            name: "__dt_as",
            localId: "__table",
            navigation: "row",
            select: true,
            resizeColumn:true,
            fixedRowHeight:false,
            rowLineHeight:32,
            rowHeight:32,
            editable: false,
            headermenu:{
                autowidth: true, 
                },
            scroll: 'xy',
            type:{
                itemIcon: DelEdIcons,
            }, 
            onClick:{
                delete_button:function(ev, id, html){
                    let item = this.getItem(id);
                    if (item.delete===false) {
                        webix.message({"type": "debug", "text": "Удаление  "+ item.c_item  + " невозможно", "expire": 5000});
                        return
                    };
                    setTimeout( () => {
                        this.select(item.id, false);
                        this.$scope.$$("_del").callEvent("onItemClick");
                    }, 50)
                },
                edit_button:function(ev, id, html){
                    this.select(id, false);
                    this.callEvent("onItemDblClick", id);
                },
            },
            //multiselect: true,
            subview: (obj, target) => {
                //let c_focus = document.activeElement;
                let item = this.$$("__table").getItem(obj.id);
                item = item.id_spr;
                item = get_spr(this, item);
                item["id"] = obj.id;
                item["s_name"] = "Страна: " + item.c_strana;
                item["t_name"] = "Название товара: " + item.c_tovar;
                item["v_name"] = "Производитель: " + item.c_zavod;
                item["dv_name"] = "Д. вещество: " + item.c_dv;
                var sub = new SubRow(this.app, {
                    //focus: c_focus,
                    //pager: this.$$("__table").getParentView().getChildViews()[2].$scope.$$("__page"), //пейджер без покового скролла
                    pager: this.$$("__table").getParentView().getParentView().getChildViews()[2].$scope.$$("__page"), //пейджер с боковым скролом
                    dt: this.$$("__table"),
                    item: item,
                    header: "<span style='color: red; text-transform: uppercase;'>Редактирование записи </span>" + item.id_spr,
                    search_bar: this.$$("_sb")
                    });
                this.ui(sub, { container: target });
                return sub.getRoot();
                },
            startPos: 1,
            posPpage: app.config.posPpage,
            totalPos: 1250,
            fi: 'c_tovar',
            di: 'asc',
            searchBar: undefined,
            searchMethod: "getSprSearchAdm",
            old_stri: "",
            css: 'adm-spr',
            columns: [
                {id: "checkbox", css: "center_p", 
                    width: 75,
                    header: [{text: "", css: "counter-dt"},
                        {content: "threeStCh", css: "center_p", contentId: "ch1",
                            inputConfig: {
                                counter: "checkbox",
                                buttonIcon: "check-circle",
                                maxCount: 5000,
                                getIdMethod: "getIdSprSearchAdm",
                            },
                        },
                        ],
                    template:"{common.checkbox()}",
                    headermenu:false,
                },
                {id: "id_mnn", width: 75,
                    template: function (obj) {
                        //return (+obj.id_dv !== 0) ? "<div> <span style='color: green'>есть</span></div>" : "<div> <span style='color: red'>нет</span></div>";
                        return (+obj.id_dv !== 0) ? "<span class='webix_icon fa-check-circle', style='color: green'></span>" :
                                                    "<span class='webix_icon fa-times-circle', style='color: red'></span>";
                        },
                    css: "center_p",
                    header: [{text: "МНН"},
                        ],
                    },
                {id: "id_spr", width: 80, sort: "server",
                    header: [{text: "IDSPR"},
                        {content: "cFilt",
                            inputConfig : {
                                    scrollView: true,
                                    pager: 2
                                    },
                            },
                        ],
                    headermenu:false,
                    },
                { id: "c_tovar", fillspace: 1, sort: "server",
                    header: [{text: "Наименование"},
                        ],
                    headermenu:false,
                    template: refTemplate,
                    },
                { id: "id_zavod", sort: "server",
                    width: 300,
                    header: [{text: "Производитель"},
                        {content: "richFilt", compare: compareTrue,
                            inputConfig : {
                                scrollView: true,
                                inputtype: "combo",
                                options: {
                                    data: vi.options.vList
                                    },
                                },
                            }
                        ]
                    },
                { id: "id_strana", sort: "server",
                    width: 200,
                    header: [{text: "Страна"},
                        {content: "richFilt", compare: compareTrue,
                            inputConfig : {
                                scrollView: true,
                                inputtype: "combo",
                                options: {
                                    data: vi.options.stranaList
                                    },
                                },
                            }
                        ]
                    },
                { id: "c_dv", hidden: true, sort: "server",
                    width: 300,
                    header: [{text: "Д. в-во"},
                        {content: "richFilt", compare: compareTrue,
                            inputConfig : {
                                scrollView: true,
                                inputtype: "combo",
                                emptyRow: "Не назначенно",
                                options: {
                                    data: vi.options.dvList
                                    },
                                },  
                            }
                        ]
                    },
                { id: "c_group", hidden: true,
                    width: 300,
                    header: [{text: "Группа"},
                        {content: "richFilt", compare: compareTrue,
                            inputConfig : {
                                scrollView: true,
                                inputtype: "combo",
                                emptyRow: "Не назначенно",
                                options: {
                                    data: vi.options.tgList,
                                    },
                                },
                            }
                        ]
                    },
                { id: "c_nds", hidden: true,
                    width: 150,
                    header: [{text: "НДС"},
                        {content: "richFilt", compare: compareTrue,
                            inputConfig : {
                                scrollView: true,
                                emptyRow: "Не назначенно",
                                options: vi.options.ndsList
                                },
                            }
                        ]
                    },
                { id: "c_hran", hidden: true,
                    width: 150,
                    header: [{text: "Условия хранения"},
                        {content: "richFilt", compare: compareTrue,
                            inputConfig : {
                                scrollView: true,
                                emptyRow: "Не назначенно",
                                options: vi.options.hranList
                                },
                            }
                        ]
                    },
                { id: "c_sezon", hidden: true,
                    width: 180,
                    header: [{text: "Сезонность"},
                        {content: "richFilt", compare: compareTrue,
                            inputConfig : {
                                scrollView: true,
                                emptyRow: "Не назначенно",
                                options: vi.options.sezonList
                                },
                            }
                        ]
                    },
                {id: "mandat", width:100,
                    template: function (obj) {
                        return (obj.c_mandat) ? "<div><span class='webix_icon fa-check-circle'></span></div>" : "<div><span class='webix_icon fa-times'></span></div>";
                        },
                    hidden: true, css: 'center_p',
                    header: [{text: "Обязательный"},
                        {content: "richFilt", compare: compareTrue,
                            inputConfig : {
                                options: [{id: 1, value: "Да"}, {id: 2, value: "Нет"}],
                                scrollView: true,
                                },
                            }
                        ],
                    },
                {id: "prescr", width:100, hidden: true, css: 'center_p',
                    template: function (obj) {
                        return (obj.c_prescr) ? "<div><span class='webix_icon fa-check-circle'></span></div>" : "<div><span class='webix_icon fa-times'></span></div>";
                        },
                    header: [{text: "Рецептурный"},
                        {content: "richFilt", compare: compareTrue,
                            inputConfig : {
                                options: [{id: 1, value: "Да"}, {id: 2, value: "Нет"}],
                                scrollView: true,
                                },
                            }
                        ],
                    },
                {id: "dt", width: 200, sort: 'server',
                    format: dt_formating_sec,
                    css: 'center_p',
                    header: [{text: "Дата изменения"}, 
                    {content: "dateRangeFilter", compare: compareTrue,
                        inputConfig:{format:dt_formating, width: 180,},
                        suggest:{
                            view:"daterangesuggest", body:{ timepicker:false, calendarCount:2}
                            },
                        },
                    ]},
                {id: "dt_ins", width: 200, //sort: 'server',
                    format: dt_formating_sec,
                    css: 'center_p',
                    header: [{text: "Дата добавления"}, 
                    //{content: "dateRangeFilter", compare: compareTrue,
                      //  inputConfig:{format:dt_formating, width: 180,},
                       // suggest:{
                         //   view:"daterangesuggest", body:{ timepicker:false, calendarCount:2}
                           // },
                        //},
                    ]},
                ],
            on: {
                'onresize': function() {
                    setTimeout( () => {
                        recalcRows(this);
                        this.$scope.$$("_sb").callEvent("onKeyPress", [13,])    
                    }, 150)
                },
                "data->onParse":function(i, data){
                    this.clearAll();
                    let localStorage =  webix.storage.session.get(this.config.name+"sel");
                    //delete(localStorage.s_pars);
                    localStorage = Object.keys(localStorage);
                    this.$scope.$$("_del").hide();
                    if (localStorage.length > 1) {
                        this.$scope.$$("_prop").show();
                    } else {
                        this.$scope.$$("_prop").hide();
                        this.getHeaderContent("ch1").uncheck();
                    }
                },
                onCheck: function(id, ii, state, prevent) {
                    let new_item = this.getItem(id);
                    if (new_item) (state === 1) ? save_storage(this, new_item.id_spr) : del_storage(this, new_item.id_spr);
                    toolTipAssign(this.$scope, this.$scope.$$("_prop"));
                    if (!prevent) {
                        this.getHeaderContent("ch1").checkInder();
                    };
                    let storage = webix.storage.session.get(this.config.name+"sel");
                    let keys = Object.keys(storage);
                    let c = keys.length - 1;
                    this.getHeaderContent("ch1").recount(c);
                    if (c === 0) this.getHeaderContent("ch1").uncheck();
                    else if (c===this.config.totalPos) this.getHeaderContent("ch1").check();
                    if (this.bState && this.bState === 1) this.remove(id);
                },
                onBeforeSort: function(field, direction) {
                    this.config.fi = field;
                    this.config.di = direction;
                    let pager = vi.getRoot().getChildViews()[2].$scope.$$("__page");
                    let old_v = pager.getValue();
                    pager.setValue((+old_v ===0) ? '1' : "0");
                    pager.refresh();
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
                    if (this.$scope.$$("_rlscheck").getValue() === 1) {
                        let item = this.getSelectedItem();
                        this.$scope.popRls.show_w("Связка с РЛС. Выберите несвязанную позицию из справочника РЛС", item, this.$scope);
                    } else {
                        this.openSub(this.getSelectedId());
                    };
                },
                onAfterLoad: function() {
                    this.hideProgress();
                    let localStorage =  webix.storage.session.get(this.config.name+"sel");
                    let localData = this.data.serialize(true);
                    localData.forEach( (item) => {
                        if (localStorage[item.id_spr]) {
                            // let new_item = Object.assign({}, item);
                            let new_item = JSON.parse(JSON.stringify(item))
                            new_item.checkbox = 1;
                            this.updateItem(item.id, new_item);
                         };
                    });
                    toolTipAssign(this.$scope, this.$scope.$$("_prop"));
                    if (this.setRow==='first') {
                        this.select(this.data.getFirstId());
                        this.getNode().focus();
                    } else if (this.setRow==='last') {
                        this.select(this.data.getLastId());
                        this.getNode().focus();
                    }
                    this.setRow = undefined;

                    // let cNodes = this.getNode().getElementsByClassName('webix_column center_p webix_first')[0].childNodes;
                    // cNodes.forEach( (node) => {
                    //     node.onmouseover = (ev) => {
                    //         console.log('ev', ev);
                    //         if (ev.buttons===1 ) {
                    //             // clearInterval(this.timerId);
                    //             let row = ev.target.getAttribute('aria-rowindex');
                    //             let item_id = this.data.order[row-1];
                    //             let item = this.getItem(item_id);
                    //             console.log('item', item);
                    //             item.checkbox = (!item.checkbox) ? 1 : 0;
                    //             this.updateItem(item.id, item); 
                    //             this.callEvent('onCheck', [item.id, undefined, item.checkbox]);
                    //             //console.log('item', item);
                    //             // //this.checked_id = item.id;
                
                    //             // this.timerId = setInterval(() => {
                    //             //     clearInterval(this.timerId);
                
                    //             //     // let row = ev.target.getAttribute('aria-rowindex');
                    //             //     // let item_id = this.$$("__table").data.order[row-1];
                    //             //     // let item = this.$$("__table").getItem(item_id);
                    //             //     if (this.checked_id !== item.id) {
                    //             //         this.checked_id = item.id;
                    //             //         item.checkbox = (!item.checkbox) ? 1 : 0;
                    //             //         this.$$("__table").updateItem(item.id, item); 
                    //             //         this.$$("__table").callEvent('onCheck', [item.id, undefined, item.checkbox]);
                    //             //     };
                    //             // }, 100);
                    //         }
                        
                    //     }
                    // })
                },

                onAfterRender: function(data) {
                    // let butts =  Array.from(document.getElementsByClassName("delete_button"));
                    let butts =  Array.prototype.slice.call(document.getElementsByClassName("delete_button"));
                    butts.forEach((butt) => {
                        butt.onmousedown =  (event) => {
                            this.$scope.$$("_del").blockEvent();
                            butt.onmouseup = () => {
                                clearInterval(this.interval);
                            };
                            this.interval = setTimeout ( () => {
                                this.$scope.$$("_del").unblockEvent();
                            }, app.config.popDelay);
                        }
                    });
                },
                onKeyPress: function(code, e){
                    if (e.code === "End" && e.shiftKey === true) {
                        this.$scope.pager.$scope.$$("_lastPB").callEvent("onItemClick");
                        this.$scope.setScroll();
                        this.getNode().focus();
                    } else if (e.code === "PageDown" && e.shiftKey === true) {
                        this.$scope.pager.$scope.$$("_nextPB").callEvent("onItemClick");
                        this.$scope.setScroll();
                        this.getNode().focus();
                    } else if (e.code === "PageUp" && e.shiftKey === true) {
                        this.$scope.pager.$scope.$$("_prevPB").callEvent("onItemClick");
                        this.$scope.setScroll();
                        this.getNode().focus();
                    } else if (e.code === "Home" && e.shiftKey === true) {
                        this.$scope.pager.$scope.$$("_firstPB").callEvent("onItemClick");
                        this.$scope.setScroll();
                        this.getNode().focus();
                    } else if (e.code === "PageDown" && this.getSelectedId() && this.data.getLastId().toString()===this.getSelectedId().id.toString()) {
                        this.$scope.pager.$scope.$$("_nextPB").callEvent("onItemClick");
                        this.$scope.setScroll();
                        this.setRow = 'last';
                    } else if (e.code === "PageUp" && this.getSelectedId() && this.data.getFirstId().toString()===this.getSelectedId().id.toString()) {
                        this.$scope.pager.$scope.$$("_prevPB").callEvent("onItemClick");
                        this.$scope.setScroll();
                        this.getNode().focus();
                        this.setRow = 'first';
                    } else if (e.code === "ArrowDown" && this.getSelectedId() && this.data.getLastId().toString()===this.getSelectedId().id.toString()) {
                        this.$scope.pager.$scope.$$("_nextPB").callEvent("onItemClick");
                        this.$scope.setScroll();
                        this.setRow = 'first';
                    } else if (e.code === "ArrowUp" && this.getSelectedId() && this.data.getFirstId().toString()===this.getSelectedId().id.toString()) {
                        this.$scope.pager.$scope.$$("_prevPB").callEvent("onItemClick");
                        this.$scope.setScroll();
                        this.setRow = 'last';
                    } else if (13 === code) {
                        if (this.getSelectedItem()) this.callEvent("onItemDblClick");
                    } else if (e.code === "Space") {
                        let item = this.getItem(this.getSelectedId().id);
                        item.checkbox = (!item.checkbox) ? 1 : 0;
                        this.updateItem(item.id, item); 
                        this.callEvent('onCheck', [item.id, undefined, item.checkbox]);
                    } else  {
                    };
                },
            }
        }

        var top = { view: "toolbar",
            height: 40,
            cols: [
                {view: "text", label: "", value: "", labelWidth: 1, placeholder: "Введите наименование", localId: "_sb", //id: "_spr_search_adm",
                    on: {
                        onKeyPress: function(code, event) {
                            clearTimeout(this.config._keytimed);
                            if (checkKey(code)) {
                                this.config._keytimed = setTimeout(function () {
                                    let pager = vi.getRoot().getChildViews()[2].$scope.$$("__page");
                                    let old_v = pager.getValue();
                                    pager.setValue((+old_v ===0) ? '1' : "0");
                                    pager.refresh();
                                    }, this.$scope.app.config.searchDelay);
                                }
                            }
                        },
                    },
                {view: "checkbox", labelRight: "<span style='color: white'>Связываем с РЛС</span>", labelWidth: 0, value: 0, width: 150,
                    localId: "_rlscheck",
                    on: {
                        onChange: function () {
                            if (this.getValue() === 1) {
                                this.$scope.$$("__table").config.searchMethod = "getSprSearchAdmRls";
                            } else {
                                this.$scope.$$("__table").config.searchMethod = "getSprSearchAdm";
                            };
                            this.$scope.$$("_unfilt").callEvent("onItemClick");
                            //this.$scope.$$("_sb").callEvent("onKeyPress", [13,]);
                        },
                    }
                },
                {view: "button", type: 'htmlbutton',
                    //width: 38, label: "<span class='webix_icon fa-history'></span><span style='line-height: 20px;'></span>",
                    localId: "_history",
                    resizable: true,
                    sWidth: 126,
                    eWidth: 40,
                    label: "",
                    width: 40,
                    extLabel: "<span style='line-height: 20px;padding-left: 5px'>История</span>",
                    oldLabel: "<span class='webix_icon fa-history'></span>",
                    click: () => {
                        let hist = webix.storage.session.get(this.$$("__table").config.name);
                        this.pophistory.show(hist, this.$$("_sb"));
                        },
                    },
                {view:"button", 
                    tooltip: "Сбросить фильтры",
                    type:"imageButton", image: './addons/img/unfilter.svg',
                    localId: "_unfilt",
                    resizable: true,
                    sWidth: 180,
                    eWidth: 40,
                    label: "",
                    width: 40,
                    extLabel: "<span style='line-height: 20px;padding-left: 5px'>Сбросить фильтры</span>",
                    oldLabel: "",
                    on: {
                        onItemClick: () => {
                            let cv = this.$$("__table");
                            let columns = cv.config.columns;
                            columns.forEach(function(item){
                                if (item.id && (item.id!=='checkbox') && cv.isColumnVisible(item.id)) {
                                    if (item.header[1] && cv.getFilter(item.id)) {
                                        if (typeof(cv.getFilter(item.id).setValue) === 'function') {
                                            cv.getFilter(item.id).setValue('');
                                        } else {
                                            cv.getFilter(item.id).value = '';
                                            };
                                        }
                                    }
                                });
                            this.$$("_sb").callEvent("onKeyPress", [13,]);
                            },
                        },
                    },
                {view:"button", type: 'htmlbutton', tooltip: "Добавить эталон",
                    localId: "_add",
                    resizable: true,
                    sWidth: 180,
                    eWidth: 40,
                    label: "",
                    width: 40,
                    extLabel: "<span style='line-height: 20px;padding-left: 5px'>Добавить эталон</span>",
                    oldLabel: "<span class='webix_icon fa-plus'></span>",
                    click: () => {
                        this.popnew.show("Новый эталон", this.$$("_sb"));

                        }
                    },
                {view:"button", type: 'htmlbutton', hidden: true, localId: "_del", tooltip: "Удалить эталон",
                    resizable: true, sWidth: 180, eWidth: 40, label: "", width: 40,
                    extLabel: "<span style='line-height: 20px;padding-left: 5px;'>Удалить эталон</span>",
                    oldLabel: "<span style='color: red', class='webix_icon fa-times'></span>",
                    on: {
                        onItemClick: () => {
                            let item = this.$$("__table").getSelectedItem();
                            this.poprelink.show("Удаление эталона. Выберите товар, к которому будут привязаны связки и штрихкоды удаляемого", item, this);
                        },
                    },
                },
                {view:"button", type: 'htmlbutton', hidden: true, localId: "_prop", tooltip: "Назначить свойства эталону",
                    resizable: true, sWidth: 200, eWidth: 40, label: "", width: 40,
                    extLabel: "<span style='line-height: 20px;padding-left: 5px;'>Назначить свойства</span>",
                    oldLabel: "<span class='webix_icon fa-copy'></span>",
                    on: {
                        onItemClick: function() {
                            if (this.$scope.propMenu.isVisible()) {
                                this.$scope.propMenu.hideM();
                            } else {
                                this.$scope.propMenu.showM(this.getNode(), this.$scope.$$("__table"));
                                };
                            },
                        },
                    },
                ]
            }

        var scroll = {localId: "scroll_view", width: 18};

        var dt = {
            view: "layout", 
            rows: [
                top,
                {cols:[
                    sprv,
                    scroll
                    
                ]},
                {$subview: PagerView},
                ]}

        return dt
        }

    setScroll() {
        let newPage = +this.pager.$scope.$$("__page").getValue();
        let scroll = this.scroll;
        let totalScroll = scroll.config.scrollHeight
        scroll.blockEvent();
        let newPos = 0;
        for (var i = totalScroll; i > 0 ; i--) {
            scroll.config.scrollPos = i;
            var p = getPNumber(scroll.config);
            if (p===newPage) {
                newPos = i;
                break;
            };
        };
        scroll.scrollTo(Math.ceil(newPos*scroll.config.zoom) + scroll.config.scrollSize /(2* scroll.config.zoom));
        scroll.pageNumber = newPage;
        setTimeout( () => {
            scroll.unblockEvent();
        }, 250);
        

    }

    ready() {
        let app = this.app;
        let thisView = this;
        thisView.pager = thisView.getRoot().getChildViews()[2];
        thisView.pager.hide();

        this.scroll = new webix.ui.vscroll({
            container:this.$$("scroll_view").$view, 
            scroll:"y",
            scrollStep: 1,
            zoom: 1,
            on: {
                onScroll: function(i) {
                    let pager = thisView.getRoot().getChildViews()[2].$scope.$$("__page");
                    let pageNumber = getPNumber(thisView.scroll.config);
                    if (this.pageNumber === pageNumber) {
                        //console.log('skip');
                    } else {
                        if (thisView.scroll.mouseIsDown===false) {
                            this.pageNumber = pageNumber;
                            clearTimeout(this.delayed);
                            this.delayed = setTimeout( () => {
                                //console.log('next11', this.pageNumber);
                                pager.setValue(this.pageNumber);
                            }, app.config.searchDelay);
                        }
                    }
                }
            },
        });
        this.scroll.config.container.classList.add('vscroll');
        addScrollTooltip(this);
        setApplyButton(this, 2);
        setButtons(this.app, this.app.config.getButt(this.getRoot()));
        this.$$("__table").config.searchBar = this.$$("_sb");
        this.$$("_sb").callEvent("onKeyPress", [13,]);
        this.$$("_sb").focus();

        this.$$("__table").getNode().onmouseover =  (ev) => {
            if ((ev.buttons===1 && 
                 ev.target.getAttribute('role')==='gridcell' && 
                 ev.target.children.length > 0 && 
                 ev.target.firstChild.classList.contains('webix_table_checkbox')) ||
               ( ev.buttons===1 && ev.target.class === 'webix_table_checkbox' )
            ) {
                ev.target.classList.add('cell-highlighted');
                clearInterval(this.timerId);
                let row = ev.target.getAttribute('aria-rowindex');
                let item_id = this.$$("__table").data.order[row-1];
                let item = this.$$("__table").getItem(item_id);
                this.timerId = setInterval(() => {
                    clearInterval(this.timerId);
                    if (this.checked_id !== item.id) {
                        this.checked_id = item.id;
                        item.checkbox = (!item.checkbox) ? 1 : 0;
                        this.$$("__table").updateItem(item.id, item); 
                        this.$$("__table").callEvent('onCheck', [item.id, undefined, item.checkbox]);
                    };
                }, 100);
            }
        };

        this.$$("__table").getNode().onmouseout =  (ev) => {
            if ((ev.buttons===1 && 
                 ev.target.getAttribute('role')==='gridcell' && 
                 ev.target.children.length > 0 && 
                 ev.target.firstChild.classList.contains('webix_table_checkbox')) ||
               ( ev.buttons===1 && ev.target.class === 'webix_table_checkbox' )
            ) {
                ev.target.classList.remove('cell-highlighted');
            }
        };

    }
    
    init() {
        this.popnew = this.ui(NewformView);
        this.pophistory = this.ui(History);
        this.poprelink = this.ui(RelinkFormView);
        this.propMenu = this.ui(PropSelectView);
        this.popRls = this.ui(RlsLinkFormView)
        webix.storage.session.put("__dt_as"+"sel", {"s_pars": undefined})
    }





}
