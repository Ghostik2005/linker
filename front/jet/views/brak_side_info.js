"use strict";

import {JetView} from "webix-jet";
import {request} from "../views/globals";


export default class BrakSideInfoView extends JetView{
    config(){
        let app = this.app;
        let vi = this;

        var dHead = {view: "form",
            localId: "_dHead",
            bodredless: true,
            margin: 0,
            padding: 0,
            elements: [
                {view: "text", value: "", label: "Нормативный документ", labelWidth: 155, name: "n_doc", localId: "tte"},
                {view: "text", value: "", label: "Наименование", labelWidth: 155, name: "name"},
                {view: "text", value: "", label: "Торговое наименование", labelWidth: 155, name: "t_name"},
                {view: "text", value: "", label: "Серия", labelWidth: 155, name: "series"},
                {view: "text", value: "", label: "Производитель", labelWidth: 155, name: "vendor"},
                {view: "text", value: "", label: "Регион", labelWidth: 155, name: "region"},
                {view: "text", value: "", label: "№ записи", labelWidth: 155, name: "number"},
                {view: "text", value: "", label: "Дата изменения", labelWidth: 155, name: "ch_dt"},
                {view: "text", value: "", label: "ЖВ", labelWidth: 155, name: "gv"},
                {view: "text", value: "", label: "Описание", labelWidth: 155, name: "desc"},
                ],
            }

        var tiny = {view: "tinymce-editor",
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
                plugins: ['print preview fullpage searchreplace autolink directionality',
                    'visualblocks visualchars fullscreen image link media template codesample table charmap',
                    'hr pagebreak nonbreaking anchor insertdatetime advlist lists textcolor wordcount',
                    'imagetools contextmenu colorpicker textpattern'
                    ],
                content_css: [
                    //'//fonts.googleapis.com/css?family=Lato:300,300i,400,400i',
                    '//www.tinymce.com/css/codepen.min.css'
                    ]
                }
            };

        var buttons = {view: 'toolbar',
            height: 35,
            css: {"margin-top": "-1px !important"},
            borderless: true,
            cols: [
                {},
                {view: 'button', value: "Сохранить", width: 120, hidden: true},
                {view: 'button', value: "Отменить", width: 120, hidden: true},
                ]
            };

        var _view ={type: 'clean',
            localId: "_prop",
            rows: [
                dHead,
                tiny,
                buttons,
                ],
            }
                
        return _view
        }

    ready() {
        }

    init() {
        }

    load_data(data) {
        //загружаем данные
        this.clear_info();
        this.$$("_dHead").parse(data);

        }
        
    clear_info() {
        //очищаем инфу
        this.$$("_dHead").clear();

        }

    disable_info() {
        //блокируем ввод инфы
        //webix.message("disabling");
        }

    enable_info() {
        //разблокируем ввод инфы
        //webix.message("enabling");
        }
    
        
    }

