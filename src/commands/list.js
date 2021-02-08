let Util = require('../utils/utils.js')
const Style = require('../utils/messageStyle.js')
const ChannelRepository = require('../repositories/channel-repository')

const MAX_EMBED_SIZE = 1800

module.exports = {
    name: 'list',
    usage: '<page>',
    description: 'Lists all the elements of the list on given page',
    execute: async (message, [page]) => {
        let { channel } = message
        let channelName = channel.name
        let chosenPage = page ? Number(page) : 1

        let dbChannel = await ChannelRepository.findOrCreate(channel)
        if (!dbChannel.items || dbChannel.items.length === 0) {
            const emptyMessage = Util.embedMessage(
                `List empty for \`${channelName}\``,
                message.author,
                '0xffff00',
                Style.error(
                    "No items found, please use the 'add {element}' command to put your first item."
                )
            )
            channel.send(emptyMessage)
            return
        }

        let fields = []
        let tempFields = []
        let size = 0
        let currentPage = 1

        function send() {
            if (fields.length === 0) return

            let embeddedMessage = Util.embedMessage(
                `List for \`${channelName}\` page ${chosenPage} / ${currentPage}`,
                message.author,
                '0xffff00',
                Style.markDown(fields.join('\n'))
            )
            channel.send(embeddedMessage)
        }

        dbChannel.items.forEach((item, i) => {
            let line = `${i + 1}. < ${item.content} >\n${item.author}\n---`
            let len = line.length
            if (size + len >= MAX_EMBED_SIZE) {
                if (currentPage === chosenPage) fields = tempFields

                currentPage += 1
                size = 0
                tempFields = []
            }

            tempFields.push(line)
            size += len
        })

        if (currentPage < chosenPage) {
            const emptyMessage = Util.embedMessage(
                `No items on page ${chosenPage} for ${channelName}`,
                message.author,
                '0xffff00',
                Style.error(
                    `No items found, there are only ${currentPage} pages.`
                )
            )
            channel.send(emptyMessage)
            return
        }

        if (fields.length === 0) fields = tempFields

        send()
    },
}
