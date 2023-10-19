const Airtable = require('airtable');
var targetBase = new Airtable({apiKey: process.env.AIRTABLE_APIKEY}).base('app3RjkAj1VpwTin6');

const mcrSync = async (mode) => {

    let functionStart = Date.now()
    let time = "Nothing to export"

    let base;
    let table;
    let view;
    let name;
    let start;
    let end;
    let fields;
    let topic;
    let recordId = `${mode}-`

    if(mode === "rbtv"){
        base = new Airtable({apiKey: process.env.AIRTABLE_APIKEY}).base('appTDzZIAs6Mp5rKR');
        table = "tblcBcHOX50iZfF2J"
        view = "viwnbaqtSdZPXKjXf"
        start = "fldkXpnvqRHAyCQ3k"
        end = "flddKwg8N7VJRCVm6"
        name = "fldGuz3ElJbLPgaaa"
        //recordId= "rbtv-"
        fields = [start, end, name]
        console.log("RBMN MCR Sync started")
    } else if(mode === "stv"){
        base = new Airtable({apiKey: process.env.AIRTABLE_APIKEY}).base('appJLPNSIXnunD5Qn');
        table = "tbl0ENWlOsnjDaw5f"
        view = "viwb1LALrHhLHgYMr"
        start = "fld0u3iJmSxKXo8BI"
        end = "fldRpqqfO2pNvfPbs"
        name = "fldJkj3hqICIQE3lW"
        topic = "fldCEBd01a0Rb2Yu1"
        //recordId= "stv-"
        fields = [start, end, name, topic]
        console.log("STV MCR Sync started")
    } else {
        throw Error("No compatible mode selected")
    }

    //Lookup view for upcoming Events in MCR Base => viw4QLny6UdhzV4fG
    //let lookup = {}
    //let mkrUpdateArray = {}

    let lookup = await new Promise((resolve, reject) => {
        let lookup = {}
        targetBase('tblvQ8VPzMfM7jTV8').select({
            view: 'viw4QLny6UdhzV4fG',
            returnFieldsByFieldId: true
        }).eachPage(function page(records, fetchNextPage){

            records.forEach(function(record){
                if(record.get('fldfKhr3w6uvENmgQ') !== undefined){
                    lookup[record.get('fldfKhr3w6uvENmgQ')] = record.updateFields
                }
            })

            fetchNextPage();

        }, function done(err) {
            if (err) { console.error(err); reject(err); }
            resolve(lookup)
        })
    })

    let airtableConfirmation = await new Promise((resolve, reject) => {

        base(table).select({
            view: view,
            returnFieldsByFieldId: true,
            fields: fields
        }).eachPage(function page(records, fetchNextPage) {
            // This function (`page`) will get called for each page of records.

            if(records.length === 0)
                resolve("no Events to export")

            records.forEach(function(record) {

                console.log('Retrieved', record.get(name));

                //add "stv-" or "rbtv-" to recordId in case they are not unique across different bases
                recordId += record.getId()

                //if record exists, update it in MCR
                if(lookup[recordId] !== undefined){
                    let fieldsToUpdate = {
                            "fldhgN0rxRMJXf3kL": "Imp | " + record.get(name),
                            "fld0IxJzstEyfeM3G": record.get(start),
                            "fld3Tcik7Ts6OowbT": record.get(end)
                    }

                    if(mode === "stv") {
                        fieldsToUpdate["fld66nr8DWbtmtemz"] = record.get(topic)
                    }

                    lookup[recordId](
                        fieldsToUpdate
                    )

                //if record doesn't exist create new record in MCR
                } else {
                    let fieldsToCreate = {
                        "fields": {
                            "fldhgN0rxRMJXf3kL": "Imp | " + record.get(name),
                            "fldeDW86G0LmAnOQV": ['RBTVSAW'],
                            "fld0IxJzstEyfeM3G": record.get(start),
                            "fld3Tcik7Ts6OowbT": record.get(end) || addHours(1, new Date(record.get(start))).toISOString(),
                            "fldfKhr3w6uvENmgQ": recordId,
                            "fld8m1Tjq4O3rXxpM": record.get(start),
                            "fldEjhHbcMQjfNEMV": record.get(end) || addHours(1, new Date(record.get(start))).toISOString()
                        }
                    }

                    if(mode === "stv") {
                        fieldsToCreate.fields["fld66nr8DWbtmtemz"] = record.get(topic)
                    }

                    targetBase('tblvQ8VPzMfM7jTV8').create([
                        fieldsToCreate
                    ], {typecast: true} ,function (err, newRecords) {
                        if (err) {
                            console.error(err);
                            return;
                        }
                        console.log("Record " + newRecords[0].getId() + " created")
                    });
                }

                    recordId = `${mode}-`

            });

            fetchNextPage();

        }, function done(err) {
            if (err) { console.error(err); reject(err); }
            resolve("done")
        });
    })


    let functionEnd = Date.now()

    if (airtableConfirmation === "done")
        time = "Time: " + (functionEnd - functionStart) + " ms"

    if(airtableConfirmation === "no Events to export")
        time = airtableConfirmation

    //console.log(time)
    return time

}


function addHours(numOfHours, date = new Date()) {
    date.setTime(date.getTime() + numOfHours * 60 * 60 * 1000);

    return date;
}

module.exports = mcrSync