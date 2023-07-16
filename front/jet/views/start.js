"use strict";
import { JetView } from "webix-jet";
import HeaderView from "../views/header";
//import FooterView from "../views/footer";
import { init_first, request, checkVal, deleteCookie, getCookie } from "../views/globals";
import { getRefs, get_refs } from "../views/globals";

export default class StartView extends JetView {
    config() {
        var ui = {
            type: "line",
            id: "main_ui",
            rows: [
                { $subview: HeaderView },
                { $subview: true, borderless: true },
                //{ $subview: FooterView },
            ],
        };
        return ui;
    }

    get_ready() {
        let app = this.app;
        let url = "getVersion";
        let params = { "user": app.config.user };
        let res = request(url, params, !0, app).response;

        res = checkVal(res, 's');
        console.log(res)
        if (res === undefined) {
            let x, r;
            let user = getCookie('linker-app');
            console.log(user)
            if (user) {
                [user, x, r] = user.split('::');
                let url = "setExit";
                let params = { "user": user };
                request(url, params, 0, app);
            };
            deleteCookie("linker-app");
            app.config.user = '';
            app.config.role = '0';
            app.config.x_api = 'x_login';
            location.href = (location.hostname === 'localhost') ? location.href : "/linker/";
        }
        console.log("23")
        app.config.group = res.group;
        app.config.roles = res.cfg;
        app.config.expert = (+res.expert === 5) ? false : true;
        let info = res.info;
        app.config.b_ver = info.version;
        app.config.b_prod = info.prod;
        let pars = res.params;
        if (pars) {
            pars = JSON.parse(pars);
            app.config.posPpage = ("posPpage" in pars) ? pars.posPpage : app.config.posPpage;
            app.config.notify = ("notify" in pars) ? pars.notify : app.config.notify;
            app.config.nDelay = ("nDelay" in pars) ? pars.nDelay : app.config.nDelay;
            app.config.save = ("save" in pars) ? pars.save : app.config.save;
            app.config.dtParams = ("dtParams" in pars) ? pars.dtParams : app.config.dtParams;
            // app.config.link = ("link" in pars) ? pars.link: app.config.link;
            app.config.defaultView = ("default" in pars) ? pars.default : 'LinkerView';
        } else {
        };
    }

    init() {
        let app = this.app;
        init_first(app);
        this.get_ready();
    }

    ready() {

        let app = this.app;
        let delay = app.config.searchDelay;
        setTimeout(get_refs, 0 * delay, { "app": app, "type": "sync", "method": "getRoles", "store": "roles_dc" });
        getRefs(app);
    }

}
