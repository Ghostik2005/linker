"use strict";

import {JetView} from "webix-jet";
import {deleteCookie} from "../views/globals";


export default class HeaderView extends JetView{
    config(){

        let app = this.app;

        function qcode(stri) {
            let new_stri = '';
            for (let i=0; i < stri.length; i++) {
                let s = stri.charCodeAt(i).toString(2);
                let addi = '';
                for (let k=0; k < 8 - s.length; k++) { addi += '0'};
                s = addi + s;
                addi = '';
                for (let k=0; k < s.length; k++) {
                    let b = +s[k];
                    b = (b===0) ? 1 : 0;
                    addi += b.toString();
                    }
                new_stri += String.fromCharCode(parseInt(addi, 2));
                }
            return new_stri
            }
        
        return {view: 'toolbar',
            css: 'header',
            cols: [
                {view: "label", label: "<a href='http://ms71.org'><span class='ms-logo', style='background-image: url(addons/img/ms_logo.jpg);'></span></a>",
                    width: 44, align: 'center', height: 36},
                {view: "label", label: "Манускрипт солюшн: Линкер | " + this.app.config.user, css: 'ms-logo-text',
                    height: 36, width: 550},
                {},
                //{view:"button", css: "butt", type: 'htmlbutton', tooltip: "Админка",
                    //label: "<span class='webix_icon fa-blind', style='color: #3498db'></span>", width: 40, localId: "_adm", hidden: !app.config.roles[app.config.role].adm,
                    //on:
                        //{
                        //onItemClick: () => {
                            //let ui = $$("adm_bar");
                            //if (ui) {
                                //this.getRoot().getParentView().getChildViews()[1].getChildViews()[0].getChildViews()[1].getChildViews()[1].setValue('adm_bar');
                            //} else {
                                //let vv = this.getRoot().getParentView().getChildViews()[1].getChildViews()[0].getChildViews()[1];
                                //var form = this.ui(AdmBarView);
                                //var formRoot = form.getRoot();
                                //var tabConfig = {
                                    //id: formRoot.config.id,
                                    //value: "<span style='line-height: 20px;'>Админка</span>", width: 170, close: true
                                    //};
                                //vv.getChildViews()[2].addView(formRoot);
                                //vv.getChildViews()[1].addOption(tabConfig, true);
                                //}
                            //},
                        //}
                    //},
                 //{view:"button", type: 'htmlbutton', tooltip: "Пропущенные",
                    //label: "<span class='webix_icon fa-archive', style='color: #3498db'></span>", width: 40, disabled: !(app.config.roles[app.config.role].skipped),
                    //hidden: !(app.config.roles[app.config.role].skipped), 
                    //on: {
                        //onItemClick: () => {
                            //let ui = $$("sk_bar");
                            //if (ui) {
                                //this.getRoot().getParentView().getChildViews()[1].getChildViews()[0].getChildViews()[1].getChildViews()[1].setValue('sk_bar');
                            //} else {
                                //let vv = this.getRoot().getParentView().getChildViews()[1].getChildViews()[0].getChildViews()[1];
                                //var form = this.ui(SkippedBarView);
                                //var formRoot = form.getRoot();
                                //var tabConfig = {
                                    //id: formRoot.config.id,
                                    //value: "<span style='line-height: 20px;'>Пропущенные</span>", width: 170, close: true
                                    //};
                                //vv.getChildViews()[2].addView(formRoot);
                                //vv.getChildViews()[1].addOption(tabConfig, true);
                                //}
                            //},
                        //},
                    //},
                //{view:"button", type: 'htmlbutton', tooltip: "Несвязанные",
                    //label: "<span class='webix_icon fa-unlink', style='color: #3498db'></span>", width: 40,
                    //on: {
                        //onItemClick: () => {
                            //let ui = $$("unlnk_bar");
                            //if (ui) {
                                //this.getRoot().getParentView().getChildViews()[1].getChildViews()[0].getChildViews()[1].getChildViews()[1].setValue('unlnk_bar');
                            //} else {
                                //let vv = this.getRoot().getParentView().getChildViews()[1].getChildViews()[0].getChildViews()[1];
                                //var form = this.ui(AllUnlinkedBarView);
                                //var formRoot = form.getRoot();
                                //var tabConfig = {
                                    //id: formRoot.config.id,
                                    //value: "<span style='line-height: 20px;'>Несвязанные</span>", width: 170, close: true
                                    //};
                                //vv.getChildViews()[2].addView(formRoot);
                                //vv.getChildViews()[1].addOption(tabConfig, true);
                                //}
                            //},
                        //},
                    //},
                //{view:"button", type: 'htmlbutton', tooltip: "Связки",
                    //label: "<span class='webix_icon fa-stumbleupon', style='color: #3498db'></span>", width: 40,
                    //on: {
                        //onItemClick: () => {
                            //let ui = $$("links_bar");
                            //if (ui) {
                                //this.getRoot().getParentView().getChildViews()[1].getChildViews()[0].getChildViews()[1].getChildViews()[1].setValue('links_bar');
                            //} else {
                                //let vv = this.getRoot().getParentView().getChildViews()[1].getChildViews()[0].getChildViews()[1];
                                //var form = this.ui(LinksBarView);
                                //var formRoot = form.getRoot();
                                //var tabConfig = {
                                    //id: formRoot.config.id,
                                    //value: "<span style='line-height: 20px;'>Связки</span>", width: 170, close: true
                                    //};
                                //vv.getChildViews()[2].addView(formRoot);
                                //vv.getChildViews()[1].addOption(tabConfig, true);
                                //}
                            //},
                        //},
                    //},
                //{width: 50},
                {view:"button", id: '_exit', css: "butt", type: 'htmlbutton', disabled: !true, tooltip: "Выход",
                    label: "<span class='webix_icon fa-sign-out', style='color: #3498db'></span>", width: 40,
                    on: {
                        onItemClick: () => {
                            deleteCookie('linker_user');
                            deleteCookie('linker_auth_key');
                            deleteCookie('linker_role');
                            this.app.config.user = '';
                            this.app.config.role = '0';
                            this.app.config.x_api = 'x_login';
                            this.show("/login")
                            }
                        },
                    },
            ]}
        }
    }
