import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

export const UserAnswer = sequelize.define(
    "UserAnswer",
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
        question_id: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        option_id: {
            type: DataTypes.STRING,
            allowNull: false,
        },
    },
    {
        tableName: "user_answers",
        timestamps: false,
    }
);

