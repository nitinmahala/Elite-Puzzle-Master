"use client"

import type React from "react"
import Link from "next/link";
import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import {
  Upload,
  Eye,
  RotateCcw,
  Trophy,
  Clock,
  MousePointer,
  Star,
  Zap,
  Target,
  Crown,
  Flame,
  Sparkles,
  Github,
  Twitter,
  Mail,
  Heart,
} from "lucide-react"

type Difficulty =
  | "beginner"
  | "novice"
  | "intermediate"
  | "advanced"
  | "expert"
  | "master"
  | "grandmaster"
  | "legendary"

type Tile = {
  id: number
  position: number
  isEmpty: boolean
  imageData?: string
}

const DIFFICULTY_CONFIG = {
  beginner: {
    size: 2,
    label: "Beginner",
    icon: Star,
    color: "from-green-400 to-green-600",
    description: "Perfect for first-timers",
  },
  novice: {
    size: 3,
    label: "Novice",
    icon: Target,
    color: "from-blue-400 to-blue-600",
    description: "Getting comfortable",
  },
  intermediate: {
    size: 4,
    label: "Intermediate",
    icon: Zap,
    color: "from-yellow-400 to-orange-500",
    description: "Ready for a challenge",
  },
  advanced: {
    size: 5,
    label: "Advanced",
    icon: Flame,
    color: "from-orange-500 to-red-500",
    description: "Serious puzzle solving",
  },
  expert: {
    size: 6,
    label: "Expert",
    icon: Crown,
    color: "from-purple-500 to-pink-500",
    description: "For puzzle masters",
  },
  master: {
    size: 7,
    label: "Master",
    icon: Sparkles,
    color: "from-pink-500 to-purple-600",
    description: "Elite level challenge",
  },
  grandmaster: {
    size: 8,
    label: "Grandmaster",
    icon: Trophy,
    color: "from-purple-600 to-indigo-600",
    description: "Legendary difficulty",
  },
  legendary: {
    size: 10,
    label: "Legendary",
    icon: Crown,
    color: "from-gradient-to-r from-yellow-400 via-red-500 to-pink-500",
    description: "The ultimate test",
  },
}

export default function PuzzleGame() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [difficulty, setDifficulty] = useState<Difficulty>("intermediate")
  const [tiles, setTiles] = useState<Tile[]>([])
  const [gameStarted, setGameStarted] = useState(false)
  const [moves, setMoves] = useState(0)
  const [time, setTime] = useState(0)
  const [isGameWon, setIsGameWon] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [isShuffling, setIsShuffling] = useState(false)
  const [bestTime, setBestTime] = useState<number | null>(null)
  const [bestMoves, setBestMoves] = useState<number | null>(null)
  const [completionPercentage, setCompletionPercentage] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const gridSize = DIFFICULTY_CONFIG[difficulty].size
  const totalTiles = gridSize * gridSize
  const currentConfig = DIFFICULTY_CONFIG[difficulty]

  // Timer effect
  useEffect(() => {
    if (gameStarted && !isGameWon) {
      timerRef.current = setInterval(() => {
        setTime((prev) => prev + 1)
      }, 1000)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [gameStarted, isGameWon])

  // Calculate completion percentage
  useEffect(() => {
    if (tiles.length > 0) {
      const correctTiles = tiles.filter((tile, index) => tile.id === index).length
      const percentage = (correctTiles / totalTiles) * 100
      setCompletionPercentage(percentage)
    }
  }, [tiles, totalTiles])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string)
        setGameStarted(false)
        setIsGameWon(false)
        setMoves(0)
        setTime(0)
        setCompletionPercentage(0)
      }
      reader.readAsDataURL(file)
    }
  }

  const createTilesFromImage = useCallback(
    async (imageSrc: string) => {
      return new Promise<Tile[]>((resolve) => {
        const img = new Image()
        img.crossOrigin = "anonymous"
        img.onload = () => {
          const canvas = canvasRef.current!
          const ctx = canvas.getContext("2d")!

          const tileSize = Math.max(80, 200 - gridSize * 10)
          canvas.width = tileSize
          canvas.height = tileSize

          const newTiles: Tile[] = []
          const tileWidth = img.width / gridSize
          const tileHeight = img.height / gridSize

          for (let i = 0; i < totalTiles; i++) {
            if (i === totalTiles - 1) {
              newTiles.push({
                id: i,
                position: i,
                isEmpty: true,
              })
            } else {
              const row = Math.floor(i / gridSize)
              const col = i % gridSize

              ctx.clearRect(0, 0, tileSize, tileSize)
              ctx.drawImage(img, col * tileWidth, row * tileHeight, tileWidth, tileHeight, 0, 0, tileSize, tileSize)

              newTiles.push({
                id: i,
                position: i,
                isEmpty: false,
                imageData: canvas.toDataURL(),
              })
            }
          }

          resolve(newTiles)
        }
        img.src = imageSrc
      })
    },
    [gridSize, totalTiles],
  )

  const shuffleTiles = (tilesToShuffle: Tile[]) => {
    const shuffled = [...tilesToShuffle]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled.map((tile, index) => ({
      ...tile,
      position: index,
    }))
  }

  const startGame = async () => {
    if (!uploadedImage) return

    setIsShuffling(true)
    const newTiles = await createTilesFromImage(uploadedImage)
    const shuffledTiles = shuffleTiles(newTiles)

    setTiles(shuffledTiles)
    setGameStarted(true)
    setIsGameWon(false)
    setMoves(0)
    setTime(0)
    setCompletionPercentage(0)
    setIsShuffling(false)
  }

  const canMoveTile = (tilePosition: number, emptyPosition: number) => {
    const tileRow = Math.floor(tilePosition / gridSize)
    const tileCol = tilePosition % gridSize
    const emptyRow = Math.floor(emptyPosition / gridSize)
    const emptyCol = emptyPosition % gridSize

    return (
      (Math.abs(tileRow - emptyRow) === 1 && tileCol === emptyCol) ||
      (Math.abs(tileCol - emptyCol) === 1 && tileRow === emptyRow)
    )
  }

  const moveTile = (clickedTileIndex: number) => {
    const emptyTileIndex = tiles.findIndex((tile) => tile.isEmpty)
    const clickedTile = tiles[clickedTileIndex]

    if (canMoveTile(clickedTile.position, tiles[emptyTileIndex].position)) {
      const newTiles = [...tiles]
      const tempPosition = newTiles[clickedTileIndex].position
      newTiles[clickedTileIndex].position = newTiles[emptyTileIndex].position
      newTiles[emptyTileIndex].position = tempPosition
      ;[newTiles[clickedTileIndex], newTiles[emptyTileIndex]] = [newTiles[emptyTileIndex], newTiles[clickedTileIndex]]

      setTiles(newTiles)
      setMoves((prev) => prev + 1)

      const isWon = newTiles.every((tile, index) => tile.id === index)
      if (isWon) {
        setIsGameWon(true)
        setGameStarted(false)

        // Update best scores
        if (!bestTime || time < bestTime) setBestTime(time)
        if (!bestMoves || moves + 1 < bestMoves) setBestMoves(moves + 1)
      }
    }
  }

  const resetGame = () => {
    setGameStarted(false)
    setIsGameWon(false)
    setMoves(0)
    setTime(0)
    setTiles([])
    setCompletionPercentage(0)
  }

  const getDifficultyRating = (diff: Difficulty) => {
    const ratings = {
      beginner: 1,
      novice: 2,
      intermediate: 3,
      advanced: 4,
      expert: 5,
      master: 6,
      grandmaster: 7,
      legendary: 8,
    }
    return ratings[diff]
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto p-4">
        {/* Header */}
        <div className="text-center mb-12 pt-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-6xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
              Elite Puzzle Master
            </h1>
          </div>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Transform any image into an extraordinary sliding puzzle challenge. Master all difficulty levels and become
            a legend!
          </p>
        </div>

        {/* Upload Section */}
        {!uploadedImage && (
          <Card className="mb-12 bg-white/10 backdrop-blur-lg border-white/20 shadow-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl text-white">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                  <Upload className="w-6 h-6" />
                </div>
                Upload Your Masterpiece
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="border-2 border-dashed border-purple-400/50 rounded-xl p-12 text-center cursor-pointer hover:border-purple-400 hover:bg-white/5 transition-all duration-300 group"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="p-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full w-fit mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <Upload className="w-12 h-12 text-white" />
                </div>
                <p className="text-xl text-gray-200 mb-3">Drop your image here or click to browse</p>
                <p className="text-gray-400">Supports JPEG, PNG, WebP, and more formats</p>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </CardContent>
          </Card>
        )}

        {/* Game Setup */}
        {uploadedImage && !gameStarted && !isGameWon && (
          <div className="grid lg:grid-cols-3 gap-8 mb-12">
            {/* Image Preview */}
            <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-2xl">
              <CardHeader>
                <CardTitle className="text-white text-xl">Your Challenge Image</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative group">
                  <img
                    src={uploadedImage || "/placeholder.svg"}
                    alt="Uploaded"
                    className="w-full h-64 object-cover rounded-xl shadow-lg group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <Button
                  variant="outline"
                  className="w-full mt-4 bg-white/10 border-white/20 text-white hover:bg-white/20"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Change Image
                </Button>
              </CardContent>
            </Card>

            {/* Difficulty Selection */}
            <Card className="lg:col-span-2 bg-white/10 backdrop-blur-lg border-white/20 shadow-2xl">
              <CardHeader>
                <CardTitle className="text-white text-xl flex items-center gap-2">
                  <Crown className="w-6 h-6 text-yellow-400" />
                  Choose Your Challenge Level
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                  {(Object.keys(DIFFICULTY_CONFIG) as Difficulty[]).map((level) => {
                    const config = DIFFICULTY_CONFIG[level]
                    const IconComponent = config.icon
                    const isSelected = difficulty === level

                    return (
                      <Button
                        key={level}
                        variant={isSelected ? "default" : "outline"}
                        onClick={() => setDifficulty(level)}
                        className={`h-auto p-4 flex flex-col gap-2 transition-all duration-300 ${
                          isSelected
                            ? `bg-gradient-to-r ${config.color} text-white shadow-lg scale-105`
                            : "bg-white/5 border-white/20 text-white hover:bg-white/10 hover:scale-105"
                        }`}
                      >
                        <IconComponent className="w-6 h-6" />
                        <div className="text-center">
                          <div className="font-semibold text-sm">{config.label}</div>
                          <div className="text-xs opacity-80">
                            {config.size}×{config.size}
                          </div>
                          <div className="flex gap-1 mt-1 justify-center">
                            {Array.from({ length: getDifficultyRating(level) }).map((_, i) => (
                              <Star key={i} className="w-2 h-2 fill-current" />
                            ))}
                          </div>
                        </div>
                      </Button>
                    )
                  })}
                </div>

                <div className="bg-white/5 rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-3 mb-2">
                    <currentConfig.icon className="w-5 h-5 text-purple-400" />
                    <span className="text-white font-semibold">{currentConfig.label} Challenge</span>
                  </div>
                  <p className="text-gray-300 text-sm">{currentConfig.description}</p>
                  <div className="mt-2 text-xs text-gray-400">
                    Grid Size: {gridSize}×{gridSize} • Total Pieces: {totalTiles - 1}
                  </div>
                </div>

                <Button
                  onClick={startGame}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-4 text-lg shadow-lg hover:shadow-xl transition-all duration-300"
                  size="lg"
                  disabled={isShuffling}
                >
                  {isShuffling ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Preparing Your Challenge...
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5 mr-2" />
                      Begin Epic Challenge
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Game Board */}
        {gameStarted && (
          <div className="space-y-8">
            {/* Enhanced Game Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                <CardContent className="p-4 text-center">
                  <Clock className="w-6 h-6 mx-auto mb-2 text-blue-400" />
                  <div className="text-2xl font-bold text-white">{formatTime(time)}</div>
                  <div className="text-xs text-gray-400">Time</div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                <CardContent className="p-4 text-center">
                  <MousePointer className="w-6 h-6 mx-auto mb-2 text-green-400" />
                  <div className="text-2xl font-bold text-white">{moves}</div>
                  <div className="text-xs text-gray-400">Moves</div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                <CardContent className="p-4 text-center">
                  <Target className="w-6 h-6 mx-auto mb-2 text-purple-400" />
                  <div className="text-2xl font-bold text-white">{completionPercentage.toFixed(0)}%</div>
                  <div className="text-xs text-gray-400">Complete</div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                <CardContent className="p-4 text-center">
                  <currentConfig.icon className="w-6 h-6 mx-auto mb-2 text-yellow-400" />
                  <div className="text-lg font-bold text-white">{currentConfig.label}</div>
                  <div className="text-xs text-gray-400">
                    {gridSize}×{gridSize}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                <CardContent className="p-4 space-y-2">
                  <div className="flex justify-between gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowPreview(true)}
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20 flex-1"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={resetGame}
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20 flex-1"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Progress Bar */}
            <Card className="bg-white/10 backdrop-blur-lg border-white/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <span className="text-white font-semibold">Progress:</span>
                  <Progress value={completionPercentage} className="flex-1 h-3" />
                  <span className="text-white font-bold">{completionPercentage.toFixed(0)}%</span>
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Puzzle Grid */}
            <div className="flex justify-center">
              <Card className="bg-black/20 backdrop-blur-lg border-white/10 p-6">
                <div
                  className="grid gap-1 rounded-lg"
                  style={{
                    gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
                    width: "fit-content",
                  }}
                >
                  {Array.from({ length: totalTiles }).map((_, index) => {
                    const tile = tiles.find((t) => t.position === index)
                    const tileSize = Math.max(40, 120 - gridSize * 5)

                    return (
                      <div
                        key={index}
                        className={`rounded-lg cursor-pointer transition-all duration-300 ${
                          tile?.isEmpty
                            ? "bg-gradient-to-br from-gray-800 to-gray-900 shadow-inner"
                            : "bg-white hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
                        }`}
                        style={{ width: tileSize, height: tileSize }}
                        onClick={() => tile && !tile.isEmpty && moveTile(tiles.indexOf(tile))}
                      >
                        {tile && !tile.isEmpty && tile.imageData && (
                          <img
                            src={tile.imageData || "/placeholder.svg"}
                            alt={`Tile ${tile.id}`}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        )}
                      </div>
                    )
                  })}
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Enhanced Win Dialog */}
        <Dialog open={isGameWon} onOpenChange={setIsGameWon}>
          <DialogContent className="bg-gradient-to-br from-purple-900 to-pink-900 border-purple-500/50 text-white max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-center gap-3 text-3xl">
                <div className="p-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-pulse">
                  <Trophy className="w-8 h-8 text-white" />
                </div>
                Victory Achieved!
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6 text-center">
              <div className="text-lg">
                🎉 Congratulations! You've conquered the{" "}
                <span className="font-bold text-yellow-400">{currentConfig.label}</span> challenge!
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/10 p-4 rounded-lg backdrop-blur">
                  <div className="text-3xl font-bold text-blue-400">{formatTime(time)}</div>
                  <div className="text-sm text-gray-300">Final Time</div>
                  {bestTime && time <= bestTime && <div className="text-xs text-yellow-400 mt-1">🏆 New Record!</div>}
                </div>
                <div className="bg-white/10 p-4 rounded-lg backdrop-blur">
                  <div className="text-3xl font-bold text-green-400">{moves}</div>
                  <div className="text-sm text-gray-300">Total Moves</div>
                  {bestMoves && moves <= bestMoves && (
                    <div className="text-xs text-yellow-400 mt-1">🏆 New Record!</div>
                  )}
                </div>
              </div>

              {(bestTime || bestMoves) && (
                <div className="bg-white/5 p-4 rounded-lg">
                  <div className="text-sm text-gray-300 mb-2">Personal Bests</div>
                  <div className="flex justify-between text-sm">
                    <span>Best Time: {bestTime ? formatTime(bestTime) : "N/A"}</span>
                    <span>Best Moves: {bestMoves || "N/A"}</span>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={startGame}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Play Again
                </Button>
                <Button
                  variant="outline"
                  onClick={resetGame}
                  className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  New Image
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Enhanced Preview Dialog */}
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="bg-gradient-to-br from-slate-900 to-purple-900 border-purple-500/50 text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <Eye className="w-6 h-6 text-purple-400" />
                Original Masterpiece
              </DialogTitle>
            </DialogHeader>
            {uploadedImage && (
              <div className="relative">
                <img
                  src={uploadedImage || "/placeholder.svg"}
                  alt="Original"
                  className="w-full rounded-xl shadow-2xl"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-xl pointer-events-none"></div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Hidden canvas for image processing */}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Enhanced Footer */}
      <footer className="relative z-10 mt-20 bg-black/20 backdrop-blur-lg border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            {/* Brand Section */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Elite Puzzle Master
                </h3>
              </div>
              <p className="text-gray-300 mb-6 max-w-md">
                The ultimate sliding puzzle experience. Transform any image into an engaging challenge with 8 difficulty
                levels, from beginner to legendary.
              </p>
              <div className="flex gap-4">
                
              <Link
  href="https://github.com/nitinmahala"
  target="_blank"
  rel="noopener noreferrer"
>
  <Button
    variant="outline"
    size="sm"
    className="bg-white/10 border-white/20 text-white hover:bg-white/20"
  >
    <Github className="w-4 h-4 mr-2" />
    GitHub
  </Button>
</Link>
                
              </div>
            </div>

            {/* Features */}
            <div>
              <h4 className="text-white font-semibold mb-4">Features</h4>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li>• 8 Difficulty Levels</li>
                <li>• Real-time Progress Tracking</li>
                <li>• Personal Best Records</li>
                <li>• Mobile-Friendly Design</li>
                <li>• Instant Image Processing</li>
                <li>• Smooth Animations</li>
              </ul>
            </div>

            
          </div>

          <div className="border-t border-white/10 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2025 Elite Puzzle Master. Crafted with <Heart className="w-4 h-4 inline text-red-400" /> for puzzle
              enthusiasts.
            </p>
            <div className="flex items-center gap-4 mt-4 md:mt-0">
              <Badge variant="secondary" className="bg-white/10 text-white">
                v2.0.0
              </Badge>
              <span className="text-gray-400 text-sm">Made with Next.js & React</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
