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
        questions: {
            type: DataTypes.INTEGER,
        },
        correctAnswers: {
            type: DataTypes.INTEGER,
        },
        date: {
            type: DataTypes.STRING,
        }
    },
    {
        tableName: "userresult",
        timestamps: false,
    }
);


