"use strict";

import {JetView} from "webix-jet";
import {request, checkVal, checkKey} from "../views/globals";
import LinkCodesView from "../views/adm-linker-codes";
import LinkSupplView from "../views/adm-linker-suppliers";
import LinkExclView from "../views/adm-linker-excludes";
import LinkFilesView from "../views/adm-linker-files";

export default class LinkerView extends JetView{
    config(){
        let app = this.app;

        var tabv = {
            view: "tabview",
            multiview: true,
            cells: [
                {header: "<span class='webix_icon fa-code'></span><span style='line-height: 20px;'> Разрешения для поставщиков</span>", width: 280, //close: true,
                    body: { view: "layout",
                        rows: [
                            {$subview: LinkSupplView},
                            ]
                        }
                    },
                {header: "<span class='webix_icon fa-code'></span><span style='line-height: 20px;'> Сведение по кодам</span>", width: 240, //close: true,
                    body: { view: "layout",
                        rows: [
                            {$subview: LinkCodesView},
                            ]
                        }
                    },
                {header: "<span class='webix_icon fa-exclamation-triangle '></span><span style='line-height: 20px;'> Слова исключения</span>", width: 240, //close: true,
                    body: { view: "layout",
                        rows: [
                            {$subview: LinkExclView},
                            ]
                        }
                    },
                {header: "<span class='webix_icon fa-file'></span><span style='line-height: 20px;'> Задания на сведении</span>", width: 240, //close: true,
                    body: { view: "layout",
                        rows: [
                            {$subview: LinkFilesView},
                            ]
                        }
                    },
                ]
            };

        return {
            view: "layout",
            //css: {'border-left': "1px solid #dddddd !important"},
            rows: [
                {height: 4},
                tabv,
                ]
            }
        }
    }
