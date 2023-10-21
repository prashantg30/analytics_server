const express = require('express');
const router = express.Router();

const { login, test } = require('../controller/login');
const { createClient, getClients, updateClient, deleteClient } = require('../controller/clientCrud');
const { createDataSource, getDataSource, updateDataSource, deleteDataSource } = require('../controller/dataSource');
const { uploadFormat, getFormats, updateFormat, deleteFormat } = require('../controller/formatsCrud');
const { getFormatNameForFieldDetails } = require('../controller/formatName');

const { upload } = require('../utils/fileUpload');
const { bodyForAddBulkData, addBulkData, showBulkData, updateRowInBulkData,deleteRowInBulkData } = require('../controller/bulkDataCrud');
const { getBulkDataForSpecificTable } = require('../controller/bulkDataSpecificTable');


//login
router.post('/login', login);
router.get('/test', test)

//client
router.post('/createClient', createClient);
router.get('/getClients', getClients);
router.put('/updateClient', updateClient);
router.delete('/deleteClient/:id', deleteClient);

//DataSource
router.post('/createDataSource', createDataSource);
router.get('/getDataSource', getDataSource);
router.put('/updateDataSource', updateDataSource);
router.delete('/deleteDataSource/:id', deleteDataSource);

//Formats
router.post('/uploadFormat', uploadFormat);
router.get('/getFormats', getFormats);
router.put('/updateFormat', updateFormat);
router.delete('/deleteFormat/:id', deleteFormat);


router.post('/formatName', getFormatNameForFieldDetails);

//bulkData
router.post('/bodyForAddBulkData', bodyForAddBulkData);
router.post('/addClientData', upload.single("myFile"), addBulkData);
router.post('/showClientData', showBulkData);
router.put('/updateRowInBulkData', updateRowInBulkData);
router.delete('/deleteRowInBulkData', deleteRowInBulkData);


router.post('/getBulkData', getBulkDataForSpecificTable);


module.exports = { router };