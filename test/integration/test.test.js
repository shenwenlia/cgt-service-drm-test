// const moment = require("moment");

// var string = "2022-05-03";
// let date1 = moment(string).format("YYYY-MM-DD");
// let date2 = moment().format("YYYY-MM-DD");
// if ( date1 <= date2) {
//     console.log(date1+date2+"test1");
// };
// console.log(date1+date2+"test2");

describe('Data Retention Manager Service Test Suite', function () {
    jest.setTimeout(1300000);
    it('Test API legalEntities/:dataSubjectRole', async function () {

        /*/////////////////////////////////////////////////////////////*/
        // const moment = require("moment");

        // var string = "2022-05-05T08:46:19.000Z"; //Z表示UTC timezone
        // let date1 = new Date(string);  //moment(string).format("YYYY-MM-DD");
        // let date2 = new Date();

        // console.log(date1 + "test1");
        // if (date1 > date2) {
        //     console.log(date1 + date2 + "<=");
        // };

        // console.log(date2 + "test2");/


        /*/////////////////////////////////////////////////////////////*/
        // cds.app.post("/prepareTestData", async (req, res, next) => {
        //     // const DrmEntity = cds.entities("com.sap.cgt.db").DrmEntity;
        //     const Contact = cds.entities("com.sap.cgt.masterdata").Contact;
        //     try {
        //         // to-do Steven
        //         await INSERT.into(Contact).columns(["id", "status_code"]).
        //             values([req.body.dataSubjectID, "1"]);
        //         let rows = await INSERT.into(DrmEntity).entries(req.body);
        //         if (rows.affectedRows > 0) {
        //             res.status(202).json("post successfully for prepareTestData");
        //         }
        //     } catch (err) {
        //         next(err);
        //     }
        // });

        //test**************************//
        // let a = 0;
        // let b = 0;
        // if (a) {
        //     await INSERT.into(this.DataSubject).columns(["id"]).
        //         values(["Test_DS_14"]);
        // }
        //test**************************//


        /*test*/
        const id1 = "Test_01";
        const id2 = "DS_02";
        const lastName1 = "1";
        const lastName2 = "2";
        const Contact = cds.entities("com.sap.cgt.masterdata").Contact;
        let rows = await DELETE.from(Contact).where`lastName <> ''`;
        rows = await INSERT.into(Contact).entries(
            { id: id1, lastName: lastName1 },
            { id: id2, lastName: lastName2 }
        );
        if (!rows?.results) { return; };
        rows = await UPDATE(Contact).where`id = ${id1}`.with`lastName = ${lastName2}`;
        if (!rows) { return; };
        let result = await SELECT`id,lastName,middleName`.from(Contact).where`id = ${id1} or id = ${id2}`;
        if (!result?.length) { return; };
        rows = await DELETE.from(Contact).where`lastName >= 0`;
        if (!rows) { return; };
        rows = await INSERT.into(Contact).entries(result); //result支持select one对象, 或select from数组
        if (!rows?.affectedRows) { return; };
        result = await SELECT`*`.from(Contact).where`id LIKE ![%Test%]`; //lastName BETWEEN 2 and 2
        if (result) { return; };

    });
}); 