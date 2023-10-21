
const fs = require('fs');
const multer = require('multer')
const path = require('path');
const csvToJson = require('convert-csv-to-json');


// UsingMulter
var storage = multer.diskStorage({
    destination: (req, file, callBack) => {
        callBack(null, '');
    },
    filename: (req, file, callBack) => {
        callBack(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
    }
})

var upload = multer({
    storage: storage
});

function UploadCsvDataToMySQL(filePath) {
    const file = fs.readFileSync(filePath);
    const data = file.toString().split(/\r\n|\r|\n/);
    const newData = data.reduce((acc, val) => {
        if (val.split(",").length === 1)
            return acc;
        if (!acc || acc.length === 0) {
            const newVal = val.split(',').map(e => e.toLowerCase().replace(/[.()'" :-]/g, ""));
            acc.push(newVal);
            return acc;
        }
        const newVal = val.split(',"').reduce((acc,val)=>{
            if(val.includes('",')){
                let newVal2= val.split('",')
                newVal2[0]=newVal2[0].replace(",",".");
                newVal2 = newVal2.join(",");
                acc.push(newVal2);
            }
            else acc.push(val);
            return acc;
        },[])
        acc.push(newVal.join(","));
        return (acc)
    }, []);
        
    const newPath = filePath + '-new.csv';
    fs.writeFileSync(newPath, newData.join('\r\n'));
    let jsonData = csvToJson.fieldDelimiter(',').getJsonFromCsv(newPath);
    
    // delete file after saving data to MySQL database
    fs.unlinkSync(filePath);
    fs.unlinkSync(newPath);

    return jsonData;
}

module.exports = {
    upload,
    UploadCsvDataToMySQL
}