package main

import (
	"context"
	"log"
	"os"

	"github.com/babacar/gemhunter/internal/envload"
	"github.com/babacar/gemhunter/internal/mcp"
	"github.com/babacar/gemhunter/internal/secret"
)

func main() {
	log.SetOutput(os.Stderr)
	envload.Load()
	if err := mcp.RunStdio(context.Background()); err != nil {
		log.Fatal(secret.Redact(err.Error()))
	}
}
