require('dotenv').config()
const { Telegraf, Markup, Scenes, session } = require('telegraf')
const sqlite3 = require('sqlite3').verbose()
const crypto = require('crypto')

const bot = new Telegraf(process.env.BOT_TOKEN)

// Создание сцены shareLinkScene
const shareLinkScene = new Scenes.BaseScene('shareLinkScene')
shareLinkScene.enter(async ctx => {
	const me = await ctx.telegram.getMe()
	const link = `https://t.me/${me.username}?start=${ctx.from.id}`
	const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(
		'Задай мне анонимный вопрос\n\n👉 ' + link
	)}`

	const messageText = `Чтобы получить много анонимных сообщений мы рекомендуем тебе разместить твою персональную ссылку в инстаграме.\n\n📌 Вот твоя персональная ссылка: <code>${link}</code>\n\nНажми на ссылку и она скопируется 👆`

	await ctx.replyWithHTML(messageText, {
		reply_markup: {
			inline_keyboard: [[{ text: 'Поделится ссылкой', url: shareUrl }]],
		},
	})

	// Удалено: await ctx.answerCbQuery('Ссылка скопирована!');
})

// Настройка сцены
const stage = new Scenes.Stage([shareLinkScene])
bot.use(session())
bot.use(stage.middleware())

// Обработчик команды start
bot.start(async ctx => {
	const referrerId = ctx.message.text.split(' ')[1]
	if (referrerId) {
		if (referrerId === ctx.from.id.toString()) {
			await ctx.reply(
				'🤦‍♀️ Писать самому себе - глупо.\n\nЛучше размести ссылку в сториз или у себя в профиле Instagram/Telegram/VK/TikTok, и сообщения не заставят себя долго ждать 😉'
			)
		} else {
			ctx.session.referrerId = referrerId
			await ctx.reply(
				'Привет! Напиши сообщение, и я передам его создателю ссылки.'
			)
		}
	} else {
		await ctx.scene.enter('shareLinkScene')
	}
})

// Обработчик сообщений
bot.on('message', async ctx => {
	const me = await ctx.telegram.getMe()
	if (ctx.session.referrerId) {
		await ctx.telegram.sendMessage(
			ctx.session.referrerId,
			`Новое сообщение от ${ctx.from.username || ctx.from.first_name}: ${
				ctx.message.text
			}`
		)
		await ctx.reply('Ваше сообщение отправлено!')
	} else {
		const link = `https://t.me/${me.username}?start=${ctx.from.id}`
		const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(
			'Задай мне анонимный вопрос\n\n👉 ' + link
		)}`
		await ctx.replyWithHTML(
			'Начните получать анонимные вопросы прямо сейчас!\n\n' +
				`👉 <code>https://t.me/${me.username}?start=${ctx.from.id}</code>\n\n` +
				'Разместите эту ссылку ☝️ в описании своего профиля Telegram, TikTok, Instagram (stories), чтобы вам могли написать 💬',
			{
				reply_markup: {
					inline_keyboard: [[{ text: 'Поделится ссылкой', url: shareUrl }]],
				},
			}
		)
	}
})

// Запуск бота
bot.launch()
console.log('Бот запущен.')
