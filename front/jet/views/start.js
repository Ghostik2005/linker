"use strict";
import {JetView} from "webix-jet";
import HeaderView from "../views/header";
//import FooterView from "../views/footer";
import {init_first, request, checkVal} from "../views/globals";

export default class StartView extends JetView{
    config() {
        var ui = {
            type:"line",
            id: "main_ui",
            rows: [
                { $subview: HeaderView },
                { $subview: true, borderless: true},
                //{ $subview: FooterView },
                ],
            };
        return ui;
        }
    init(){
        let app = this.app;
        let url = app.config.r_url + "?getVersion";
        let params = {"user": app.config.user};
        let res = request(url, params, !0).response;
        res = checkVal(res, 's');
        app.config.roles = res.cfg;
        app.config.expert = (+res.expert === 5) ? false : true;
        let info = res.info;
        app.config.b_ver = info.version;
        app.config.b_prod = info.prod;
        let pars = res.params;
        if (pars) {
            //console.log('pp present', pars);
            pars = JSON.parse(pars);
            app.config.posPpage = ("posPpage" in pars) ? pars.posPpage: app.config.posPpage;
            app.config.notify = ("notify" in pars) ? pars.notify: app.config.notify;
            app.config.nDelay = ("nDelay" in pars) ? pars.nDelay: app.config.nDelay;
            app.config.save = ("save" in pars) ? pars.save: app.config.save;
            app.config.dtParams = ("dtParams" in pars) ? pars.dtParams: app.config.dtParams;
            // app.config.link = ("link" in pars) ? pars.link: app.config.link;
            app.config.defaultView = ("default" in pars) ? pars.default: 'LinkerView';
            
        } else {
            };
        init_first(app);
        }
    }
