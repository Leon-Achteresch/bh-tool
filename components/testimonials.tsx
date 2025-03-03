"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";

export function Testimonials() {
  const testimonials = [
    {
      name: "Max Müller",
      role: "Auszubildender, Mechatroniker",
      content: "Der Berichtsheft-Editor hat meinen Ausbildungsalltag komplett verändert. Ich spare jede Woche mehrere Stunden Zeit und kann mich besser auf meine eigentlichen Aufgaben konzentrieren.",
      avatar: "MM"
    },
    {
      name: "Laura Schmidt",
      role: "Ausbilderin, IT-Systemkauffrau",
      content: "Als Ausbilderin betreue ich mehrere Auszubildende. Mit dem Berichtsheft-Editor kann ich Berichte schnell prüfen und Feedback geben - alles digital und ohne Papierchaos.",
      avatar: "LS"
    },
    {
      name: "Thomas Weber",
      role: "Ausbildungsleiter, Industriekaufmann",
      content: "Die Plattform bietet uns genau die Funktionen, die wir für eine moderne Ausbildung benötigen. Die Zeitersparnis und Übersichtlichkeit sind beeindruckend.",
      avatar: "TW"
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
    <section className="w-full py-12 md:py-24 lg:py-32 bg-background">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Das sagen unsere Nutzer</h2>
            <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Erfahren Sie, wie der Berichtsheft-Editor den Ausbildungsalltag unserer Nutzer verbessert
            </p>
          </div>
        </div>
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12"
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
        >
          {testimonials.map((testimonial, index) => (
            <motion.div key={index} variants={item}>
              <Card className="h-full">
                <CardHeader className="flex flex-row items-center gap-4">
                  <Avatar>
                    <AvatarFallback>{testimonial.avatar}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">{testimonial.name}</CardTitle>
                    <CardDescription>{testimonial.role}</CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">"{testimonial.content}"</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}