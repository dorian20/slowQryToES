

const sqlComment = '*+ [payment-api].paymentreadonlydao.selectpgcardcocdmappinglist *';

const excpSqlID = 'PaymentReadOnlyDAO.selectPgCardcoCdMappingList';

console.log(sqlComment.includes(excpSqlID.toLowerCase()));
