"use strict";

import {JetView} from "webix-jet";
import {request, checkVal} from "../views/globals";
import BrakAddMassView from "../views/brak-add-mass";


export default class BrakSideInfoView extends JetView{
    config(){
        let app = this.app;
        let vi = this;

        var dHead = {view: "form",
            localId: "_dHead",
            oldData: undefined,
            bodredless: true,
            margin: 0,
            padding: 0,
            elements: [
                {view: "text", value: "", label: "Нормативный документ", labelWidth: 155, name: "n_doc", localId: "tte",
                    on:{
                        onKeyPress: function() {
                            this.$scope.show_b();
                            },
                        onTimedKeyPress: function() {
                            let value = this.getValue();
                            this.$scope.parent.getSelectedItem().n_doc = value;
                            this.$scope.parent.refresh(this.$scope.parent.getSelectedId());
                            },
                        },
                    },
                {view: "text", value: "", label: "Наименование", labelWidth: 155, name: "name",p_disable: true,
                    on:{
                        onKeyPress: function() {
                            this.$scope.show_b()
                            },
                        },
                    },
                {view: "text", value: "", label: "Торговое наименование", labelWidth: 155, name: "t_name",
                    on:{
                        onKeyPress: function() {
                            this.$scope.show_b()
                            },
                        },
                    },
                {view: "text", value: "", label: "Серия", labelWidth: 155, name: "series", p_disable: true,
                    on:{
                        onKeyPress: function() {
                            this.$scope.show_b()
                            },
                        },
                    },
                {view: "text", value: "", label: "Производитель", labelWidth: 155, name: "vendor", p_disable: true,
                    on:{
                        onKeyPress: function() {
                            this.$scope.show_b()
                            },
                        },
                    },
                {view: "text", value: "", label: "Регион", labelWidth: 155, name: "region",
                    on:{
                        onKeyPress: function() {
                            this.$scope.show_b()
                            },
                        },
                    },
                {view: "text", value: "", label: "№ записи", labelWidth: 155, name: "number",
                    on:{
                        onKeyPress: function() {
                            this.$scope.show_b()
                            },
                        },
                    },
                {view: "text", value: "", label: "Дата изменения", labelWidth: 155, name: "ch_dt", disabled: true, p_disable: !true,
                    on:{
                        onKeyPress: function() {
                            this.$scope.show_b()
                            },
                        },
                    },
                {view: "text", value: "", label: "ЖВ", labelWidth: 155, name: "gv",
                    on:{
                        onKeyPress: function() {
                            this.$scope.show_b()
                            },
                        },
                    },
                {view: "text", value: "", label: "Описание", labelWidth: 155, name: "desc",
                    on:{
                        onKeyPress: function() {
                            this.$scope.show_b()
                            },
                        },
                    },
                {view: "text", value: "", label: "О", labelWidth: 155, name: "f_name", hidden: true},
                ],
            }

        var tiny = {view: "tinymce-editor",
            css: {"margin-top": "-1px !important"},
            borderless: true,
            localId: '_editor',
            config: {
                theme:"modern",
                statusbar: false,
                image_advtab: true,
                branding: false,
                language: 'ru',
                menubar: false,
                toolbar: !false,
                //nowrap : true,
                toolbar1: 'fontselect fontsizeselect | undo redo | bold italic strikethrough forecolor backcolor | alignleft aligncenter alignright alignjustify | codesample',
                plugins: ['searchreplace visualblocks visualchars codesample',
                    'pagebreak nonbreaking anchor insertdatetime advlist lists textcolor',
                    'colorpicker textpattern'
                    ],
                content_css: [
                    //'//fonts.googleapis.com/css?family=Lato:300,300i,400,400i',
                    //'//www.tinymce.com/css/codepen.min.css'
                    ]
                },
            };

        var buttons = {view: 'toolbar',
            height: 35,
            css: {"margin-top": "-1px !important"},
            borderless: true,
            cols: [
                {},
                {view: 'button', value: "Сохранить", width: 120, localId: "_save", hidden: true,
                    on: {
                        onItemClick: function() {
                            let item = this.$scope.$$("_dHead").getValues();
                            item['letter'] = this.$scope.$$("_editor").getValue();
                            //console.log('this', this.$scope.topParent.$scope.$$("_check_w_mails").getValue());
                            let check_letter = this.$scope.topParent.$scope.$$("_check_w_mails").getValue();
                            let params = {"user": app.config.user, "item": item, "check_letter": check_letter};
                            let url = app.config.r_url + "?setBrakMail";
                            let res = request(url, params, !0).response;
                            res = checkVal(res, 's');
                            if (res) {
                                webix.message({type: "success", text: "Сохранено", expire: 2000});
                                this.$scope.topParent.getSelectedItem().m_count = +res.m_count;
                                this.$scope.reopen();
                                if (res.similar && res.similar.length && res.similar.length > 0) {
                                    //есть еще серии, вызываем окно с их выбором.если там будет отмена - то просто зарываем и все
                                    // если еще выберут - то перезаписываем все что выбрали.
                                    this.$scope.popmass.show_w(this.$scope.topParent.$scope, item, res.similar);
                                }

                            } else {
                                webix.message({type: "error", text: "Ошибка сохранения", expire: 2000});
                                this.$scope.$$("_cancel").callEvent('onItemClick');
                                };
                            },
                        },
                    },
                {view: 'button', value: "Отменить", width: 120, localId: "_cancel", hidden: true,
                    on: {
                        onItemClick: function() {
                            if (this.$scope.parent.config.$new) {
                                this.$scope.reopen()
                            } else {
                                if (this.$scope.$$("_dHead").config.oldData) {
                                    this.$scope.load_data(this.$scope.$$("_dHead").config.oldData, this.$scope.parent, this.$scope.topParent);
                                    this.$scope.hide_b()
                                    let value = this.$scope.$$("_dHead").getValues().n_doc;
                                    this.$scope.parent.getSelectedItem().n_doc = value;
                                    this.$scope.parent.refresh(this.$scope.parent.getSelectedId());
                                } else {
                                    this.$scope.clear_info()
                                    };
                                };
                            },
                        },
                    },
                ]
            };

        var _view ={type: 'clean',
            localId: "_prop",
            rows: [
                {localId: "_acord",
                    header: "Свойства документа",
                    body: dHead
                    },
                tiny,
                buttons,
                ],
            }
                
        return _view
        }

    ready() {
        this.disable_info();
        }


    reopen() {
        let noMail = this.topParent.$scope.$$("_noMail").getValue();
        let tableSelectedItem = this.topParent.getSelectedItem()
        let tableSelectedId = tableSelectedItem.id;
        this.clear_info();
        if (noMail ===1 && this.topParent.getItem(tableSelectedId).m_count > 0){
            this.topParent.remove(tableSelectedId);
        } else {
            this.topParent.closeSub(tableSelectedId);
            this.topParent.openSub(tableSelectedId, this.topParent);
        }
        this.disable_info();
        }

    load_data(data, parent, topParent) {
        //загружаем данные
        this.$$("_acord").define({collapsed: false});
        this.$$("_acord").resize();
        this.clear_info();
        this.$$("_dHead").parse(data);
        this.$$("_editor").setValue(data.letter || '');
        this.parent = parent;
        //this.$$("_dHead").config._parent = parent;
        this.topParent = topParent;
        //this.$$("_dHead").config._topParent = topParent;
        this.$$("_dHead").config.oldData = this.$$("_dHead").getValues();
        this.$$("_dHead").config.oldData.letter = this.$$("_editor").getValue();
        if (parent.config.$new) this.show_b();
        //this.hide_b();
        let ffr = document.getElementsByTagName("iframe");
        //console.log('item', ffr[0].contentDocument.body);
        ffr[0].contentDocument.body.onkeydown = () => {
            this.show_b();
            };
        this.$$("_editor").focus();
        }
        
    clear_info() {
        //очищаем инфу
        this.$$("_dHead").clear();
        this.$$("_editor").setValue('');
        this.hide_b();
        }

    show_b() {
        this.$$("_save").show(); 
        this.$$("_cancel").show();
        }

    hide_b() {
        this.$$("_save").hide();
        this.$$("_cancel").hide();
        }
        
    disable_info() {
        //блокируем ввод инфы
        let childs = this.$$("_dHead").getChildViews();
        childs.forEach( function (child, i, childs) {
            child.disable();
            });
        }

    enable_info() {
        //разблокируем ввод инфы
        let childs = this.$$("_dHead").getChildViews();
        childs.forEach( function (child, i, childs) {
            if (!child.config.p_disable) child.enable();
            });
        }
    
    init() {
        this.popmass = this.ui(BrakAddMassView);
    }

        
    }

