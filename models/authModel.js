const { sql } = require("../config/db");

const saveToken = async (userId, refreshToken) => {
  try {
    await global.db
      .request()
      .input("user_id", sql.Int, userId)
      .input("token", sql.NVarChar, refreshToken).query(`
      MERGE Tokens AS target
      USING (SELECT @user_id AS user_id, @token AS token) AS source
      ON target.user_id = source.user_id
      WHEN MATCHED THEN
        UPDATE SET token = source.token, created_at = GETDATE()
      WHEN NOT MATCHED THEN
        INSERT (user_id, token) VALUES (source.user_id, source.token);
    `);
  } catch (err) {
    console.error("DB Error in saveToken:", err);
    throw err;
  }
};

const getRefreshToken = async (refreshToken) => {
  try {
    const result = await global.db
      .request()
      .input("token", sql.NVarChar, refreshToken)
      .query("SELECT token FROM Tokens WHERE token = @token");

    return result.recordset[0]; // or return result.recordset if you expect multiple
  } catch (err) {
    console.error("DB Error in getRefreshToken:", err);
    throw err;
  }
};

module.exports = { saveToken, getRefreshToken };
