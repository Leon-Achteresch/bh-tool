"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpenText, CheckCircle, Clock, FileText, PenTool, Users } from "lucide-react";
import { motion } from "framer-motion";

export function Features() {
  const features = [
    {
      icon: <PenTool className="h-10 w-10 text-primary" />,
      title: "Einfache Berichtserstellung",
      description: "Erstellen Sie Ihre Ausbildungsnachweise mit einem intuitiven Editor und Formatierungsoptionen."
    },
    {
      icon: <FileText className="h-10 w-10 text-primary" />,
      title: "Vorlagen & Automatisierung",
      description: "Nutzen Sie Vorlagen für wiederkehrende Berichte und sparen Sie wertvolle Zeit."
    },
    {
      icon: <CheckCircle className="h-10 w-10 text-primary" />,
      title: "Digitaler Genehmigungsprozess",
      description: "Reichen Sie Ihre Berichte digital ein und erhalten Sie schnelles Feedback von Ihrem Ausbilder."
    },
    {
      icon: <Clock className="h-10 w-10 text-primary" />,
      title: "Automatische Erinnerungen",
      description: "Verpassen Sie keine Fristen mehr durch automatische Benachrichtigungen und Erinnerungen."
    },
    {
      icon: <Users className="h-10 w-10 text-primary" />,
      title: "Rollenbasierte Zugriffsrechte",
      description: "Verschiedene Benutzerrollen für Auszubildende, Ausbilder und Administratoren."
    },
    {
      icon: <BookOpenText className="h-10 w-10 text-primary" />,
      title: "Export & Archivierung",
      description: "Exportieren Sie Ihre Berichte als PDF oder Word und archivieren Sie sie sicher."
    }
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <section className="w-full py-12 md:py-24 lg:py-32 bg-muted/50">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Funktionen</h2>
            <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Entdecken Sie die vielfältigen Möglichkeiten des Berichtsheft-Editors
            </p>
          </div>
        </div>
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12"
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
        >
          {features.map((feature, index) => (
            <motion.div key={index} variants={item}>
              <Card className="h-full">
                <CardHeader>
                  <div className="mb-2">{feature.icon}</div>
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}