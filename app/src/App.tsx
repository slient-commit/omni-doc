import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function App() {
  const [count, setCount] = useState(0)

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-8 bg-background p-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight">omni-doc</h1>
        <p className="text-muted-foreground">
          React 19 + Vite + shadcn/ui + Tailwind v4
        </p>
      </div>

      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Welcome back</CardTitle>
          <CardDescription>Sign in to your account to continue.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@example.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="••••••••" />
          </div>
        </CardContent>
        <CardFooter className="flex-col gap-3">
          <Button className="w-full">Sign in</Button>
          <Button variant="outline" className="w-full">
            Create account
          </Button>
        </CardFooter>
      </Card>

      <div className="flex items-center gap-3">
        <Button variant="secondary" onClick={() => setCount((c) => c + 1)}>
          Clicked {count} times
        </Button>
        <Button variant="ghost" onClick={() => setCount(0)}>
          Reset
        </Button>
      </div>
    </main>
  )
}

export default App
