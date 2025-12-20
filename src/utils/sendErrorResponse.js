const { buildError } = require('../utils/response');

module.exports = (err, req, res) => {
    let resErr = buildError(err);
    res.status(resErr?.status || 500).json(resErr.response);
};
