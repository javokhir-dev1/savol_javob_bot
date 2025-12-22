import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

export const UserResult = sequelize.define(
    "UserResult",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        user_id: {
            type: DataTypes.STRING,
            allowNull: false,
        },
    },
    {
        tableName: "userresult",
        timestamps: false,
    }
);


