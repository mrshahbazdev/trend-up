import { Box, IconButton, Menu } from "@mui/material"

 

export default function EmojiPicker({ anchorEl, open, onClose, onEmojiSelect }) {
  const emojis = ["😀", "😂", "😍", "🤔", "👍", "👎", "❤️", "🔥", "💯", "😢", "😡", "🎉", "👏", "🙌", "💪", "🤝"]

  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          maxWidth: 300,
          p: 1,
          bgcolor: "background.paper",
        },
      }}
    >
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
        {emojis.map((emoji) => (
          <IconButton
            key={emoji}
            size="small"
            onClick={() => {
              onEmojiSelect(emoji)
              onClose()
            }}
            sx={{ fontSize: "1.2rem" }}
          >
            {emoji}
          </IconButton>
        ))}
      </Box>
    </Menu>
  )
}
