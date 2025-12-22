import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

export const Timer = sequelize.define(
    "Timer",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        time: {
            type: DataTypes.STRING,
            allowNull: false,
        },
    },
    {
        tableName: "timer",
        timestamps: false,
    }
);

