import { Meta, StoryObj } from "@storybook/react"

import { ModeToggle } from "@/components/mode-toggle"
import { ThemeProvider } from "@/components/theme-provider"

// Defining metadata for the story
const meta: Meta<typeof ModeToggle> = {
  title: "Components/ModeToggle",
  component: ModeToggle,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <div className="p-4">
          <Story />
        </div>
      </ThemeProvider>
    ),
  ],
  parameters: {
    layout: "centered",
  },
}

export default meta

type Story = StoryObj<typeof ModeToggle>

// Default story
export const Default: Story = {}

// Dark theme story
export const DarkTheme: Story = {
  parameters: {
    backgrounds: { default: "dark" },
    themes: {
      themeOverride: "dark",
    },
  },
}

// Light theme story
export const LightTheme: Story = {
  parameters: {
    backgrounds: { default: "light" },
    themes: {
      themeOverride: "light",
    },
  },
}

// High contrast theme story
export const HighContrastTheme: Story = {
  parameters: {
    backgrounds: { default: "light" },
    themes: {
      themeOverride: "high-contrast-light",
    },
  },
}

// Different viewports - for responsive testing
export const Mobile: Story = {
  parameters: {
    viewport: {
      defaultViewport: "mobile1",
    },
  },
}

export const Tablet: Story = {
  parameters: {
    viewport: {
      defaultViewport: "tablet",
    },
  },
}

// Container story - showing how it fits within a container
export const InContainer: Story = {
  decorators: [
    (Story) => (
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <div
          className="flex items-center justify-center rounded-md border border-gray-300 p-4"
          style={{ width: "200px", height: "60px" }}
        >
          <Story />
        </div>
      </ThemeProvider>
    ),
  ],
}
