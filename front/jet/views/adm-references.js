"use strict";

import {JetView} from "webix-jet";
import {getRefs, request, checkVal, checkKey} from "../views/globals";
import SprView from "../views/adm-spr";
import CountryView from "../views/adm-country";
import VendorsView from "../views/adm-vendors";
import DvView from "../views/adm-dv";
import BarcodesView from "../views/adm-barcodes";
import GroupsView from "../views/adm-groups";
import HranView from "../views/adm-hran";
import NdsView from "../views/adm-nds";
import SeasonsView from "../views/adm-seasons";
import IssueView from "../views/adm-issues";
import TGroupsView from "../views/adm-t-groups";

export default class RefView extends JetView{
    config(){
        let app = this.app;

        var tabv = {
            view: "tabview",
            multiview: true,
            cells: [
                {header: "<span style='line-height: 20px;'>Эталоны</span>", width: 120, //close: true,
                    body: { view: "layout",
                        rows: [
                            {$subview: SprView},
                            ]
                        }
                    },
                {header: "<span style='line-height: 20px;'>Товарные группы</span>", width: 140, //close: true,
                    body: { view: "layout",
                        rows: [
                            {$subview: TGroupsView},
                            ]
                        }
                    },
                {header: "<span style='line-height: 20px;'>Формы выпуска</span>", width: 120, //close: true,
                    body: { view: "layout",
                        rows: [
                            {$subview: IssueView},
                            ]
                        }
                    },
                {header: "<span style='line-height: 20px;'>Страны</span>", width: 120, //close: true,
                    body: { view: "layout",
                        rows: [
                            {$subview: CountryView},
                            ]
                        }
                    },
                {header: "<span style='line-height: 20px;'>Производители</span>", width: 120, //close: true,
                    body: { view: "layout",
                        rows: [
                            {$subview: VendorsView},
                            ]
                        }
                    },
                {header: "<span style='line-height: 20px;'>ДВ</span>", width: 120, //close: true,
                    body: { view: "layout",
                        rows: [
                            {$subview: DvView},
                            ]
                        }
                    },
                {header: "<span style='line-height: 20px;'>Штрихкоды</span>", width: 120, //close: true,
                    body: { view: "layout",
                        rows: [
                            {$subview: BarcodesView},
                            //{$subview: "adm-barcodes/adm-barcodes-s"},
                            ]
                        }
                    },
                {header: "<span style='line-height: 20px;'>Группы</span>", width: 120, //close: true,
                    body: { view: "layout",
                        rows: [
                            {$subview: GroupsView},
                            ]
                        }
                    },
                {header: "<span style='line-height: 20px;'>Условия хранения</span>", width: 140, //close: true,
                    body: { view: "layout",
                        rows: [
                            {$subview: HranView},
                            ]
                        }
                    },
                {header: "<span style='line-height: 20px;'>НДС</span>", width: 120, //close: true,
                    body: { view: "layout",
                        rows: [
                            {$subview: NdsView},
                            ]
                        }
                    },
                {header: "<span style='line-height: 20px;'>Сезоны</span>", width: 120, //close: true,
                    body: { view: "layout",
                        rows: [
                            {$subview: SeasonsView},
                            ]
                        }
                    },
                ]
            };

        return {
            view: "layout", type: "clean",
            //css: {'border-left': "1px solid #dddddd !important"},
            rows: [
                {view: "toolbar",
                height: 40,
                    css: {"border-top": "0px"},
                    cols: [
                        {},
                        {}

                        ]
                    },
                {height: 3},
                tabv,
                ]
            }
        }

    ready() {
        getRefs(this.app);
    }

    }
