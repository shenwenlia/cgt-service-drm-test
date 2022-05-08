/**
 * base service of application, provide fundamental tech functions
 */
class BaseService extends cds.ApplicationService {
    async init() {
        await super.init();
        /**
         * @type {{info:Function,warn:Function,debug:Function,error:Function}}
         */
        this.logger = cds.log(this?.constructor?.name);
        /**
         * @type {import("@sap/cds/apis/services").DatabaseService}
         */
        this.db = await cds.connect.to("db");
    }
}

module.exports = { BaseService };
