"use strict";

import {JetView} from "webix-jet";
import {getHeaderLength} from "../views/globals";
import SeasonsView from "../views/adm-seasons";
import SprView from "../views/adm-spr";
import CountryView from "../views/adm-country";
import VendorsView from "../views/adm-vendors";
import DvView from "../views/adm-dv";
import BarcodesView from "../views/adm-barcodes";
import GroupsView from "../views/adm-groups";
import HranView from "../views/adm-hran";
import NdsView from "../views/adm-nds";
import IssueView from "../views/adm-issues";
import TGroupsView from "../views/adm-t-groups";
import {screens} from "../models/variables";


export default class RefPopView extends JetView{
    config(){
        let app = this.app;

        function set_bar(parent) {
            var tab_view = parent.$scope.target.$scope.getRoot().getTopParentView().getChildViews()[1].getChildViews()[0].getChildViews()[1];
            let ui_id = parent.config.b_id;
            tab_view.getChildViews()[1].setValue(ui_id);
        }

        function add_bar(parent, view) {
            var tab_view = parent.$scope.target.$scope.getRoot().getTopParentView().getChildViews()[1].getChildViews()[0].getChildViews()[1];
            let header = (view === SeasonsView) ? screens.SeasonsView :
                         (view === CountryView) ? screens.CountryView :
                         (view === VendorsView) ? screens.VendorsView :
                         (view === DvView) ? screens.DvView :
                         (view === BarcodesView) ? screens.BarcodesView :
                         (view === GroupsView) ? screens.GroupsView :
                         (view === HranView) ? screens.HranView :
                         (view === NdsView) ? screens.NdsView :
                         (view === IssueView) ? screens.IssueView :
                         (view === TGroupsView) ? screens.TGroupsView :
                         (view === SprView) ? screens.SprView :
                         undefined
            if (!header) return;

            //вычисляем размер заголовка
            

            let uid = webix.uid();
            var tabConfig = {
                id: uid,
                value: header, width: getHeaderLength(header),//200,
                close: true
            };
            let formConfig = {
                $scope: parent.$scope,
                id: uid,
                $subview: view
            };
            parent.config.b_id = uid;
            tab_view.getChildViews()[2].addView(formConfig);
            tab_view.getChildViews()[1].addOption(tabConfig, true);
        }

        const body = {
            view: "toolbar", css: 'side_tool_bar', borderless: true,
            rows: [
                {view: "button", 
                    type: 'htmlbutton',
                    tooltip: "Просмотр и редактирование эталонов",
                    label: "<span class='side_icon'>Эталоны</span>",
                    hidden: !true,
                    height: 40, 
                    on: {
                        onItemClick: function() {
                            if ($$(this.config.b_id)) {
                                set_bar(this)
                            }  else {
                                add_bar(this, SprView);
                            }
                            this.$scope.hide();
                        },
                    },
                },
                {view: "button",
                    type: 'htmlbutton',
                    tooltip: "Просмотр и редактирование товарных групп",
                    label: "<span class='side_icon'>Товарные группы</span>",
                    hidden: !(app.config.roles[app.config.role].skipped),
                    height: 40,
                    on: {
                        onItemClick: function() {
                            if ($$(this.config.b_id)) {
                                set_bar(this)
                            }  else {
                                add_bar(this, TGroupsView);
                            }
                            this.$scope.hide();
                        },
                    },
                },
                {view: "button",
                    type: 'htmlbutton',
                    tooltip: "Просмотр и редактирование форм выпуска",
                    label: "<span class='side_icon'>Формы выпуска</span>",
                    hidden: !(app.config.roles[app.config.role].skipped),
                    height: 40,
                    on: {
                        onItemClick: function() {
                            if ($$(this.config.b_id)) {
                                set_bar(this)
                            }  else {
                                add_bar(this, IssueView);
                            }
                            this.$scope.hide();
                        },
                    },
                },
                {view: "button",
                    type: 'htmlbutton',
                    tooltip: "Просмотр и редактирование стран",
                    label: "<span class='side_icon'>Страны</span>",
                    hidden: !(app.config.roles[app.config.role].skipped),
                    height: 40,
                    on: {
                        onItemClick: function() {
                            if ($$(this.config.b_id)) {
                                set_bar(this)
                            }  else {
                                add_bar(this, CountryView);
                            }
                            this.$scope.hide();
                        },
                    },
                },
                {view: "button",
                    type: 'htmlbutton',
                    tooltip: "Просмотр и редактирование производителей",
                    label: "<span class='side_icon'>Производители</span>",
                    hidden: !(app.config.roles[app.config.role].skipped),
                    height: 40,
                    on: {
                        onItemClick: function() {
                            if ($$(this.config.b_id)) {
                                set_bar(this)
                            }  else {
                                add_bar(this, VendorsView);
                            }
                            this.$scope.hide();
                        },
                    },
                },
                {view: "button",
                    type: 'htmlbutton',
                    tooltip: "Просмотр и редактирование действующих веществ",
                    label: "<span class='side_icon'>ДВ</span>",
                    hidden: !(app.config.roles[app.config.role].skipped),
                    height: 40,
                    on: {
                        onItemClick: function() {
                            if ($$(this.config.b_id)) {
                                set_bar(this)
                            }  else {
                                add_bar(this, DvView);
                            }
                            this.$scope.hide();
                        },
                    },
                },
                {view: "button",
                    type: 'htmlbutton',
                    tooltip: "Просмотр и редактирование штрих-кодов",
                    label: "<span class='side_icon'>Штрих-коды</span>",
                    hidden: !(app.config.roles[app.config.role].skipped),
                    height: 40,
                    on: {
                        onItemClick: function() {
                            if ($$(this.config.b_id)) {
                                set_bar(this)
                            }  else {
                                add_bar(this, BarcodesView);
                            }
                            this.$scope.hide();
                        },
                    },
                },
                {view: "button",
                    type: 'htmlbutton',
                    tooltip: "Просмотр и редактирование групп",
                    label: "<span class='side_icon'>Группы</span>",
                    hidden: !(app.config.roles[app.config.role].skipped),
                    height: 40,
                    on: {
                        onItemClick: function() {
                            if ($$(this.config.b_id)) {
                                set_bar(this)
                            }  else {
                                add_bar(this, GroupsView);
                            }
                            this.$scope.hide();
                        },
                    },
                },
                {view: "button",
                    type: 'htmlbutton',
                    tooltip: "Просмотр и редактирование условий хранения",
                    label: "<span class='side_icon'>Условия хранения</span>",
                    hidden: !(app.config.roles[app.config.role].skipped),
                    height: 40,
                    on: {
                        onItemClick: function() {
                            if ($$(this.config.b_id)) {
                                set_bar(this)
                            }  else {
                                add_bar(this, HranView);
                            }
                            this.$scope.hide();
                        },
                    },
                },
                {view: "button",
                    type: 'htmlbutton',
                    tooltip: "Просмотр и редактирование НДС",
                    label: "<span class='side_icon'>НДС</span>",
                    hidden: !(app.config.roles[app.config.role].skipped),
                    height: 40,
                    on: {
                        onItemClick: function() {
                            if ($$(this.config.b_id)) {
                                set_bar(this)
                            }  else {
                                add_bar(this, NdsView);
                            }
                            this.$scope.hide();
                        },
                    },
                },
                {view: "button",
                    type: 'htmlbutton',
                    tooltip: "Просмотр и редактирование сезонов",
                    label: "<span class='side_icon'>Сезоны</span>",
                    hidden: !(app.config.roles[app.config.role].skipped),
                    height: 40,
                    on: {
                        onItemClick: function() {
                            if ($$(this.config.b_id)) {
                                set_bar(this)
                            }  else {
                                add_bar(this, SeasonsView);
                            }
                            this.$scope.hide();
                        },
                    },
                },

            ]}

        return {view: "popup",
            head: "sub-menu",
            loclalId: "_pop",
            height: (app.config.roles[app.config.role].skipped) ? 0 : 60,
            width: 180,
            css: "pop-up-menu",
            relative: true,
            body: body
            }
        }
    isVisible() {
        return this.getRoot().isVisible();
    }
    show(target, parent){
        this.target = target;
        this.parent  = parent;
        return this.getRoot().show(this.target.$view);
    }
    hide(){
        return this.getRoot().hide();
    }

    init(){

    }

    ready() {

    }
}
