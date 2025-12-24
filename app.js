import { bot } from "./bot.js"

import { Markup } from "telegraf"

import { v4 as uuidv4 } from "uuid"
import dotenv from "dotenv"
import { UserResult } from "./models/userresult.model.js"
import { UserAnswer } from "./models/userAnswer.model.js"
import { Option } from "./models/options.model.js"
import { Question } from "./models/question.model.js"
import { User } from "./models/user.model.js"

import XLSX from "xlsx"
import fs from "fs"

dotenv.config()

const admins = process.env.ADMINS.split(",")

export const session = {}

bot.start(async (ctx) => {
    const isUserExists = await User.findOne({ where: { user_id: String(ctx.from.id) } })

    if (!isUserExists) {
        await User.create({ user_id: String(ctx.from.id), full_name: `${ctx.from.first_name} ${ctx.from.last_name || ""}` })
    }
    ctx.replyWithHTML(`<b>Assalomu Alaykum, ${ctx.from.first_name} Savolga Javob loyihasidasiz❗️</b>

Quyidagilardan keraklisini tanlang, savollarga javob bering hamda telefon, pul mukofoti yoki maxsus sovg'alardan birini qo'lga kiriting!`,
        Markup.keyboard([
            ["📝 10ta savol"],
        ])
            .resize()
            .oneTime())
})


bot.hears("📝 10ta savol", async (ctx) => {
    try {
        await ctx.replyWithHTML(`<b>Sizga 10 ta savol taqdim etiladi, barcha savollarga javob berish uchun umumiy 10 daqiqa vaqtingiz bor❗️</b>

10 ta savoldan 10 tasiga to'g'ri javob berganlar, Smartfon

9 taga javob berganlar pul mukofoti

8 taga javob berganlar maxsus sovg'a yutib olish imkoniyatiga ega bo'ladilar!

<b>Boshlash uchun pastdagi tugmani bosing❗️</b>`,
            Markup.inlineKeyboard([
                [Markup.button.webApp("Boshlash", "https://ai-forcipate-alejandra.ngrok-free.dev")]
            ]))
    } catch (err) {
        console.log(err)
    }
})

bot.command("delete", async (ctx) => {
    try {
        if (admins.includes(ctx.from.username)) {
            await User.destroy({
                where: {},
            })

            await UserResult.destroy({
                where: {}
            })

            await UserAnswer.destroy({
                where: {}
            })
            await ctx.reply("o'chirildi")
        }
    } catch (err) {
        console.log(err)
    }
})


bot.command("admin", async (ctx) => {
    try {

        if (admins.includes(ctx.from.username)) {
            await ctx.replyWithHTML("<b>Assalomu alaykum adminjon 👋</b>",
                Markup.inlineKeyboard([
                    [Markup.button.callback("Natijalar", "get_results")],
                    [Markup.button.callback("Savol qo'shish", "add_question")],
                    [Markup.button.callback("Barcha Savollar", "all_questions")],
                    [Markup.button.callback("Timerni o'zgartirish", "edit_timer")],

                ])
            )
        }
    } catch (err) {
        console.log(err)
    }
})

bot.action("edit_timer", async (ctx) => {
    try {
        await ctx.reply("Zo'r menga vaqtni daqiqada yuboring! Misol (2, 10, 20)")
        if (!session[ctx.from.id]) session[ctx.from.id] = {}
        session[ctx.from.id]["state"] = "waiting_timer"
    } catch (err) {
        console.log(err)
    }
})

bot.action("all_questions", async (ctx) => {
    try {
        const questions = await Question.findAll()

        if (questions.length == 0) {
            return await ctx.reply("Hozircha savollar mavjud emas")
        }

        for (let i = 0; i < questions.length; i++) {
            await ctx.reply(questions[i].body,
                Markup.inlineKeyboard([
                    [Markup.button.callback("Savolni o'chirish", `delete_question_${questions[i].id}`)],
                    [Markup.button.callback("Variant qo'shish", `add_variant_${questions[i].id}`)],
                    [Markup.button.callback("Barcha variantlar", `all_variants_${questions[i].id}`)],

                ])
            )
        }
    } catch (err) {
        console.log(err)
    }
})

bot.action(/all_variants_(.+)/, async (ctx) => {
    try {
        const question_id = ctx.match[1]
        const question = await Question.findOne({ where: { id: question_id } })
        await ctx.reply(question.body)
        const options = await Option.findAll({ where: { question_id } })

        if (options.length == 0) return await ctx.reply("Hozircha bu savolga variantlar mavjud emas!")
        for (let i = 0; i < options.length; i++) {
            let text = options[i].option_text
            if (options[i].is_correct) {
                text += " (to'g'ri)"
            }
            await ctx.reply(text,
                Markup.inlineKeyboard([
                    [Markup.button.callback("Variantni o'chirish", `delete_variant_${options[i].id}`)]
                ])
            )
        }
    } catch (err) {
        console.log(err)
    }
})

bot.action(/delete_variant_(.+)/, async (ctx) => {
    try {
        const option_id = ctx.match[1]
        await Option.destroy({ where: { id: option_id } })
        await ctx.reply("Variant o'chirildi")
        await ctx.deleteMessage()
            .catch((err) => console.log(err))
    } catch (err) {
        console.log(err)
    }
})

bot.action(/add_variant_(.+)/, async (ctx) => {
    try {
        const question_id = ctx.match[1]
        await ctx.reply("Zo'r variantni menga yuboring!")
        if (!session[ctx.from.id]) session[ctx.from.id] = {}

        session[ctx.from.id]["state"] = "waiting_variant"
        session[ctx.from.id]["question_id"] = question_id
    } catch (err) {
        console.log(err)
    }
})

bot.action(/delete_question_(.+)/, async (ctx) => {
    try {
        const question_id = ctx.match[1]
        await Question.destroy({ where: { id: question_id } })
        await ctx.reply("Savol o'chirildi")
        await ctx.deleteMessage()
            .catch((err) => console.log(err))
    } catch (err) {
        console.log(err)
    }
})

bot.action("add_question", async (ctx) => {
    try {
        await ctx.reply("Zo'r menga savolni yuboring!")
        if (!session[ctx.from.id]) session[ctx.from.id] = {}

        session[ctx.from.id]["state"] = "waiting_question"
    } catch (err) {
        console.log(err)
    }
})

bot.on("message", async (ctx) => {
    try {
        if (!session[ctx.from.id]) session[ctx.from.id] = {}
        if (session[ctx.from.id]["state"] == "waiting_question") {
            const question = await Question.create({ body: ctx.message.text })
            await ctx.reply("Savol qo'shildi!",
                Markup.inlineKeyboard([
                    [Markup.button.callback("Variant qo'shish", `add_variant_${question.id}`)]
                ])
            )
        } else if (session[ctx.from.id]["state"] == "waiting_variant") {
            const question_id = session[ctx.from.id]["question_id"]
            const newOption = await Option.create({
                question_id: question_id,
                option_text: ctx.message.text,
                is_correct: false
            })

            await ctx.reply("Bu variant to'g'ri javobmi!",
                Markup.inlineKeyboard([
                    [Markup.button.callback("Ha", `correct_variant_${newOption.id}`)],
                    [Markup.button.callback("Yo'q", `incorrect_variant`)]
                ])
            )
        } else if (session[ctx.from.id]["state"] == "waiting_timer") {
            await fetch("http://localhost:3051/api/timer", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ time: ctx.message.text })
            }).then(async () => {
                await ctx.reply("Timer muvaffaqiyatli o'zgartirldi")
            }).catch((err) => console.log(err))
        }
    } catch (err) {
        console.log(err)
    }
})

bot.action("stop_variant", async (ctx) => {
    try {
        if (!session[ctx.from.id]) session[ctx.from.id] = {}
        session[ctx.from.id]["state"] = ""
        await ctx.reply("Variant qo'shish bekor qilindi")
    } catch (err) {
        console.log(err)
    }
})

bot.action(/correct_variant_(.+)/, async (ctx) => {
    try {
        const optionId = ctx.match[1]
        const option = await Option.findOne({ where: { id: optionId } })
        await option.update({ is_correct: true })
        await ctx.reply("Option qo'shildi")
        await ctx.deleteMessage()
            .catch((err) => console.log(err))

        if (!session[ctx.from.id]) session[ctx.from.id] = {}
        const question_id = session[ctx.from.id]["question_id"]

        await ctx.reply("Ya'na variant qo'shasizmi?",
            Markup.inlineKeyboard([
                [Markup.button.callback("Ha", `add_variant_${question_id}`)],
                [Markup.button.callback("Yo'q", "stop_variant")]
            ])
        )
    } catch (err) {
        console.log(err)
    }
})

bot.action("incorrect_variant", async (ctx) => {
    try {
        await ctx.reply("Option qo'shildi")
        await ctx.deleteMessage()
            .catch((err) => console.log(err))

        if (!session[ctx.from.id]) session[ctx.from.id] = {}
        const question_id = session[ctx.from.id]["question_id"]
        await ctx.reply("Ya'na variant qo'shasizmi?",
            Markup.inlineKeyboard([
                [Markup.button.callback("Ha", `add_variant_${question_id}`)],
                [Markup.button.callback("Yo'q", "stop_variant")]
            ])
        )
    } catch (err) {
        console.log(err)
    }
})

// { id: 5, user_id: '7761304842', question_id: '1', option_id: '4' },
// { id: 6, user_id: '7761304842', question_id: '2', option_id: '7' }

function saveArrayToExcel(array, filePath) {
    const rows = array.map(item => [item]);

    const worksheet = XLSX.utils.aoa_to_sheet(rows);

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

    XLSX.writeFile(workbook, filePath);
}

bot.action("get_results", async (ctx) => {
    try {
        await ctx.reply("Quyidagilardan birini tanlang",
            Markup.inlineKeyboard([
                [Markup.button.callback("Barchasi", "all_results")],
                [Markup.button.callback("10/10", "on_10")],
                [Markup.button.callback("10/9", "on_9")],
                [Markup.button.callback("10/8", "on_8")],
            ])
        )
        // const results = await UserResult.findAll({ raw: true })
        // const resultsArr = []


        // for (let i = 0; i < results.length; i++) {
        //     const user = await ctx.getChat(results[i].user_id)
        //     resultsArr.push(`${results[i].user_id} ${user.first_name} ${user.last_name || ""} ${results[i].questions}/${results[i].correctAnswers}`)
        // }
        // const file_name = `${uuidv4()}.xlsx`

        // try {
        //     saveArrayToExcel(resultsArr, file_name)
        //     await ctx.replyWithDocument({ source: file_name })
        // } catch (err) {
        //     console.log(err)
        // } finally {
        //     fs.unlink(file_name, (err) => {
        //         if (err) {
        //             console.log(err)
        //         }
        //     })
        // }

    } catch (err) {
        console.log(err)
    }
})

async function getResult(ctx, num) {
    const results = await UserResult.findAll({ where: { correctAnswers: num } })
    const resultsArr = []

    for (let i = 0; i < results.length; i++) {
        const user = await User.findOne({ where: { user_id: results[i].user_id } })
        resultsArr.push(`${results[i].user_id} ${user.full_name} ${results[i].questions}/${results[i].correctAnswers}`)
    }
    const file_name = `${uuidv4()}.xlsx`

    try {
        saveArrayToExcel(resultsArr, file_name)
        await ctx.replyWithDocument({ source: file_name })
    } catch (err) {
        console.log(err)
    } finally {
        fs.unlink(file_name, (err) => {
            if (err) {
                console.log(err)
            }
        })
    }
}

bot.action(/on_(.+)/, async (ctx) => {
    try {
        const count = ctx.match[1]
        getResult(ctx, count)
    } catch (err) {
        console.log(err)
    }
})

bot.action("all_results", async (ctx) => {
    try {
        const results = await UserResult.findAll()
        const resultsArr = []


        for (let i = 0; i < results.length; i++) {
            const user = await User.findOne({ where: { user_id: results[i].user_id } })
            resultsArr.push(`${results[i].user_id} ${user.full_name} ${results[i].questions}/${results[i].correctAnswers}`)
        }
        const file_name = `${uuidv4()}.xlsx`

        try {
            saveArrayToExcel(resultsArr, file_name)
            await ctx.replyWithDocument({ source: file_name })
        } catch (err) {
            console.log(err)
        } finally {
            fs.unlink(file_name, (err) => {
                if (err) {
                    console.log(err)
                }
            })
        }
    } catch (err) {
        console.log(err)
    }
})